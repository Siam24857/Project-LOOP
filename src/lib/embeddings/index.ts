import prisma from "@/lib/db"

const EMBEDDING_DIM = 256

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

function tokenize(text: string): string[] {
  const words = text.toLowerCase().split(/[^a-z0-9']+/g).filter(Boolean)
  const tokens: string[] = [...words]

  for (let i = 0; i < words.length - 1; i++) {
    if (words[i].length > 2 && words[i + 1].length > 2) {
      tokens.push(`${words[i]}_${words[i + 1]}`)
    }
  }

  return tokens
}

export function generateEmbedding(text: string): number[] {
  if (!text || !text.trim()) {
    return new Array(EMBEDDING_DIM).fill(0)
  }

  const tokens = tokenize(text)
  if (tokens.length === 0) {
    return new Array(EMBEDDING_DIM).fill(0)
  }

  const vector = new Array(EMBEDDING_DIM).fill(0)

  for (const token of tokens) {
    vector[hashString(token) % EMBEDDING_DIM] += 1
  }

  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1

  return vector.map((value) => value / norm)
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  if (normA === 0 || normB === 0) return 0
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

export function vectorToString(vector: number[]): string {
  return JSON.stringify(vector)
}

export function stringToVector(str: string): number[] {
  try {
    const parsed = JSON.parse(str)
    if (Array.isArray(parsed) && parsed.every((n) => typeof n === "number")) {
      return parsed
    }
  } catch {
    // fall through to default
  }
  return new Array(EMBEDDING_DIM).fill(0)
}

export async function storeFeedbackEmbedding(
  feedbackId: string,
  workspaceId: string
) {
  const feedback = await prisma.feedback.findUnique({
    where: { id: feedbackId },
    include: { themes: { include: { theme: true } } },
  })

  if (!feedback) return null

  const relevantText = [
    feedback.content,
    feedback.category ? `category: ${feedback.category}` : "",
    feedback.themes.length > 0
      ? `themes: ${feedback.themes.map((t) => t.theme.name).join(", ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n")

  const vector = generateEmbedding(relevantText)

  return prisma.embedding.upsert({
    where: { feedbackId },
    create: {
      feedbackId,
      workspaceId,
      vector: vectorToString(vector),
    },
    update: {
      vector: vectorToString(vector),
      workspaceId,
    },
  })
}

export async function ensureAllEmbeddings(workspaceId: string, limit = 200) {
  const [feedbackCount, embeddingCount] = await Promise.all([
    prisma.feedback.count({ where: { workspaceId } }),
    prisma.embedding.count({ where: { workspaceId } }),
  ])

  if (feedbackCount <= embeddingCount) return

  const missingFeedback = await prisma.feedback.findMany({
    where: {
      workspaceId,
      embedding: { is: null },
    },
    take: limit,
    select: { id: true },
  })

  for (const feedback of missingFeedback) {
    await storeFeedbackEmbedding(feedback.id, workspaceId)
  }
}

export interface SemanticResult {
  feedbackId: string
  score: number
  content: string
  sentiment: string
  source: string
  customerName: string
  createdAt: Date
}

export async function searchFeedback(
  question: string,
  workspaceId: string,
  topK = 25
): Promise<SemanticResult[]> {
  const queryVector = generateEmbedding(question)

  const embeddings = await prisma.embedding.findMany({
    where: { workspaceId },
    include: {
      feedback: {
        select: {
          id: true,
          content: true,
          sentiment: true,
          source: true,
          customerName: true,
          createdAt: true,
        },
      },
    },
    take: 1000,
  })

  if (embeddings.length === 0) return []

  return embeddings
    .map((embedding) => ({
      feedbackId: embedding.feedbackId,
      score: cosineSimilarity(queryVector, stringToVector(embedding.vector)),
      content: embedding.feedback.content,
      sentiment: embedding.feedback.sentiment,
      source: embedding.feedback.source,
      customerName: embedding.feedback.customerName,
      createdAt: embedding.feedback.createdAt,
    }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
}