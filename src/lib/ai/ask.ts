import { callGemini } from "./client"
import prisma from "@/lib/db"
import { searchFeedback, ensureAllEmbeddings } from "../embeddings"

export interface SupportingFeedback {
  id: string
  content: string
  sentiment: string
  source: string
  customerName: string
  createdAt: Date
}

export interface AskLoopResult {
  answer: string
  supportingFeedback: SupportingFeedback[]
}

export async function askLoop(
  question: string,
  workspaceId: string
): Promise<AskLoopResult> {
  const feedbackCount = await prisma.feedback.count({ where: { workspaceId } })

  if (feedbackCount === 0) {
    return {
      answer:
        "No feedback data is available in your workspace yet. Please add some feedback first.",
      supportingFeedback: [],
    }
  }

  await ensureAllEmbeddings(workspaceId, 150)

  const semanticResults = await searchFeedback(question, workspaceId, 25)

  let relevantFeedback: {
    id: string
    content: string
    sentiment: string
    source: string
    customerName: string
    createdAt: Date
    score: number
  }[] = semanticResults.map((result) => ({
    id: result.feedbackId,
    content: result.content,
    sentiment: result.sentiment,
    source: result.source,
    customerName: result.customerName,
    createdAt: result.createdAt,
    score: result.score,
  }))

  if (relevantFeedback.length < 5) {
    const fallback = await keywordFallback(question, workspaceId, relevantFeedback)
    relevantFeedback = fallback
  }

  if (relevantFeedback.length === 0) {
    return {
      answer:
        "I couldn't find any feedback related to your question. The data in this workspace may not cover this topic yet.",
      supportingFeedback: [],
    }
  }

  const context = relevantFeedback
    .map(
      (f, i) =>
        `#${i + 1} [${f.source}] (${f.sentiment}) "${f.content}" - ${f.customerName}`
    )
    .join("\n")

  const systemPrompt = `You are LOOP, an AI customer feedback analyst. Answer the user's question based ONLY on the provided customer feedback context. Be specific and cite feedback references (e.g., #1, #3, #5). If the context doesn't contain enough information, say so. Be concise and actionable. Include specific examples from the feedback.`

  const userMessage = `Customer Feedback Context:\n${context}\n\nQuestion: ${question}`

  const answer = await callGemini(systemPrompt, userMessage, 1500)

  return {
    answer,
    supportingFeedback: relevantFeedback.slice(0, 8),
  }
}

async function keywordFallback(
  question: string,
  workspaceId: string,
  current: AskLoopResult["supportingFeedback"]
) {
  const existingIds = new Set(current.map((f) => f.id))

  const feedbacks = await prisma.feedback.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      id: true,
      content: true,
      sentiment: true,
      source: true,
      customerName: true,
      createdAt: true,
    },
  })

  const questionLower = question.toLowerCase()
  const questionWords = questionLower.split(/\s+/).filter((w) => w.length > 3)

  const scored = feedbacks
    .filter((f) => !existingIds.has(f.id))
    .map((f) => {
      const contentLower = f.content.toLowerCase()
      let score = 0

      for (const word of questionWords) {
        if (contentLower.includes(word)) score += 1
      }

      if (
        /complain|problem|issue|negative/.test(questionLower) &&
        f.sentiment === "NEGATIVE"
      ) {
        score += 2
      }

      if (/like|good|positive|love/.test(questionLower) && f.sentiment === "POSITIVE") {
        score += 2
      }

      return { ...f, score }
    })

  const additional = scored
    .filter((f) => f.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)

  return [...current.map((f) => ({ ...f, score: 0 })), ...additional].slice(0, 15)
}