const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash"

interface GeminiTextPart {
  text?: string
}

interface GeminiContentPart {
  text?: string
  thoughtSignature?: string
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: GeminiContentPart[]
    }
    finishReason?: string
  }>
  promptFeedback?: {
    blockReason?: string
  }
}

export function isBillingError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const message = error.message.toLowerCase()
  return (
    message.includes("quota") ||
    message.includes("credit balance") ||
    message.includes("billing") ||
    message.includes("api key not valid") ||
    message.includes("unauthenticated") ||
    message.includes("permission_denied") ||
    message.includes("insufficient")
  )
}

export function billingErrorResponse(): { error: string } {
  return {
    error:
      "AI service is unavailable: the AI provider key is invalid, has exhausted its quota, or the account has no credits. Check your Gemini API key/billing in Google AI Studio to enable AI features.",
  }
}

export async function callGemini(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number = 2000
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured")
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userMessage }] }],
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.4 },
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Gemini API error: ${response.status} - ${error}`)
  }

  const data = (await response.json()) as GeminiResponse

  if (data.promptFeedback?.blockReason) {
    throw new Error(`Gemini API error: prompt blocked (${data.promptFeedback.blockReason})`)
  }

  const text = data.candidates?.[0]?.content?.parts
    ?.filter((part): part is GeminiTextPart => typeof part.text === "string")
    .map((part) => part.text as string)
    .join("\n")
    .trim()

  if (!text) {
    throw new Error(
      `Gemini API error: empty response (finishReason: ${data.candidates?.[0]?.finishReason ?? "unknown"})`
    )
  }

  return text
}