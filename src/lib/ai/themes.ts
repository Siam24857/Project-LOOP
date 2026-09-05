import { callGemini } from "./client"
import { z } from "zod"

const themeSchema = z.object({
  themes: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
    })
  ),
})

export async function detectThemes(
  feedbackContents: string[]
): Promise<{ name: string; description: string }[]> {
  const feedbackList = feedbackContents
    .map((f, i) => `${i + 1}. "${f}"`)
    .join("\n")

  const systemPrompt = `You are an AI theme analyst. Analyze the following customer feedback items and identify recurring themes. Return a JSON object with a "themes" array containing objects with "name" and "description" fields. Each theme should represent a pattern found across multiple feedback items. Return 3-8 themes. Return ONLY valid JSON.`

  const result = await callGemini(
    systemPrompt,
    `Customer feedback items:\n${feedbackList}`,
    1000
  )

  try {
    const parsed = JSON.parse(result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim())
    const validated = themeSchema.parse(parsed)
    return validated.themes
  } catch {
    return []
  }
}
