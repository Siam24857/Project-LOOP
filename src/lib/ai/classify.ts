import { callGemini } from "./client"
import { z } from "zod"

const classificationSchema = z.object({
  sentiment: z.enum(["positive", "negative", "neutral"]),
  category: z.string(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  summary: z.string(),
  themes: z.array(z.string()),
})

export type ClassificationResult = z.infer<typeof classificationSchema>

export async function classifyFeedback(content: string): Promise<ClassificationResult> {
  const systemPrompt = `You are an AI feedback analyst. Analyze the following customer feedback and return a JSON object with:
- sentiment: "positive", "negative", or "neutral"
- category: one of "performance", "ux", "pricing", "support", "features", "bug", "checkout", "mobile", "onboarding", "billing", "security", "other"
- priority: "low", "medium", "high", or "urgent"
- summary: a one-sentence summary of the feedback
- themes: an array of 1-3 theme tags (e.g., ["Checkout", "Performance"])

Return ONLY valid JSON, no other text.`

  return runClassification(systemPrompt, `Customer feedback: "${content}"`)
}

async function runClassification(
  systemPrompt: string,
  userMessage: string
): Promise<ClassificationResult> {
  const firstAttempt = await classifyOnce(systemPrompt, userMessage)
  if (firstAttempt) {
    return firstAttempt
  }

  const secondAttempt = await classifyOnce(systemPrompt, userMessage)

  if (!secondAttempt) {
    throw new Error("Classification failed after retry")
  }

  return secondAttempt
}

async function classifyOnce(
  systemPrompt: string,
  userMessage: string
): Promise<ClassificationResult | null> {
  try {
    const result = await callGemini(systemPrompt, userMessage, 500)
    const parsed = JSON.parse(
      result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    )
    return classificationSchema.parse(parsed)
  } catch {
    return null
  }
}