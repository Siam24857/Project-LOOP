import { callGemini } from "./client"
import prisma from "@/lib/db"
import { z } from "zod"

const reportSchema = z.object({
  title: z.string(),
  summary: z.string(),
  content: z.string(),
})

export interface VoCReportData {
  stats: {
    totalFeedback: number
    positive: number
    negative: number
    neutral: number
    positiveChange: number
    negativeChange: number
    topThemes: string[]
    sources: Record<string, number>
  }
}

export interface GeneratedReport {
  title: string
  summary: string
  content: string
  reportData: VoCReportData
}

export async function generateVoCReport(workspaceId: string): Promise<GeneratedReport> {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

  const [totalFeedback, currentFeedback, previousFeedback, topThemes, recentPositive, recentNegative] =
    await Promise.all([
      prisma.feedback.count({ where: { workspaceId } }),
      prisma.feedback.findMany({
        where: { workspaceId, createdAt: { gte: thirtyDaysAgo } },
        select: { sentiment: true, content: true, source: true, customerName: true },
      }),
      prisma.feedback.findMany({
        where: { workspaceId, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
        select: { sentiment: true },
      }),
      prisma.theme.findMany({
        where: { workspaceId },
        orderBy: { feedbackCount: "desc" },
        take: 5,
        select: { name: true, feedbackCount: true, positiveCount: true, negativeCount: true, trendScore: true },
      }),
      prisma.feedback.findMany({
        where: { workspaceId, sentiment: "POSITIVE", createdAt: { gte: thirtyDaysAgo } },
        take: 3,
        select: { content: true, customerName: true },
      }),
      prisma.feedback.findMany({
        where: { workspaceId, sentiment: "NEGATIVE", createdAt: { gte: thirtyDaysAgo } },
        take: 5,
        select: { content: true, customerName: true },
      }),
    ])

  const currentPositive = currentFeedback.filter((f) => f.sentiment === "POSITIVE").length
  const currentNegative = currentFeedback.filter((f) => f.sentiment === "NEGATIVE").length
  const currentNeutral = currentFeedback.filter((f) => f.sentiment === "NEUTRAL").length

  const previousPositive = previousFeedback.filter((f) => f.sentiment === "POSITIVE").length
  const previousNegative = previousFeedback.filter((f) => f.sentiment === "NEGATIVE").length

  const positiveChange = previousPositive > 0
    ? Math.round(((currentPositive - previousPositive) / previousPositive) * 100)
    : 0
  const negativeChange = previousNegative > 0
    ? Math.round(((currentNegative - previousNegative) / previousNegative) * 100)
    : 0

  const sources = currentFeedback.reduce((acc, f) => {
    acc[f.source] = (acc[f.source] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const statsText = `
Workspace Statistics (Last 30 Days):
- Total Feedback: ${currentFeedback.length}
- Positive: ${currentPositive} (${currentFeedback.length > 0 ? Math.round((currentPositive / currentFeedback.length) * 100) : 0}%)
- Negative: ${currentNegative} (${currentFeedback.length > 0 ? Math.round((currentNegative / currentFeedback.length) * 100) : 0}%)
- Neutral: ${currentNeutral}
- Positive Change: ${positiveChange > 0 ? "+" : ""}${positiveChange}%
- Negative Change: ${negativeChange > 0 ? "+" : ""}${negativeChange}%

Top Themes:
${topThemes.map((t) => `- ${t.name}: ${t.feedbackCount} feedback items (${t.positiveCount} positive, ${t.negativeCount} negative, trend: ${t.trendScore > 0 ? "+" : ""}${Math.round(t.trendScore * 100)}%)`).join("\n")}

Source Distribution:
${Object.entries(sources).map(([s, c]) => `- ${s}: ${c}`).join("\n")}

Recent Positive Feedback:
${recentPositive.map((f) => `- "${f.content}" - ${f.customerName}`).join("\n")}

Recent Negative Feedback (Pain Points):
${recentNegative.map((f) => `- "${f.content}" - ${f.customerName}`).join("\n")}
`

  const systemPrompt = `You are a Voice-of-Customer analyst. Generate a professional VoC report based on the provided statistics and feedback. The report should include:
1. An executive summary (2-3 sentences)
2. Detailed analysis of themes and trends
3. Key customer problems
4. Actionable recommendations (3-5 specific items)

Write in a professional business tone. Be specific and cite data. Return ONLY valid JSON with these fields:
{
  "title": "Voice of Customer Report - [Month Year]",
  "summary": "Executive summary...",
  "content": "Full detailed report content in markdown format..."
}`

  const reportData: VoCReportData = {
    stats: {
      totalFeedback: totalFeedback,
      positive: currentPositive,
      negative: currentNegative,
      neutral: currentNeutral,
      positiveChange,
      negativeChange,
      topThemes: topThemes.map((t) => t.name),
      sources,
    },
  }

  const generated = await runReportGeneration(systemPrompt, statsText, reportData)
  if (!generated) {
    throw new Error("Report generation failed after retry")
  }

  return generated
}

async function runReportGeneration(
  systemPrompt: string,
  statsText: string,
  reportData: VoCReportData
): Promise<GeneratedReport | null> {
  const firstAttempt = await generateOnce(systemPrompt, statsText)
  if (firstAttempt) {
    return { ...firstAttempt, reportData }
  }

  const secondAttempt = await generateOnce(systemPrompt, statsText)
  if (secondAttempt) {
    return { ...secondAttempt, reportData }
  }

  return null
}

async function generateOnce(
  systemPrompt: string,
  statsText: string
): Promise<{ title: string; summary: string; content: string } | null> {
  try {
    const result = await callGemini(systemPrompt, statsText, 3000)
    const parsed = JSON.parse(
      result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    )
    const validated = reportSchema.parse(parsed)
    return {
      title: validated.title || "Voice of Customer Report",
      summary: validated.summary || "",
      content: validated.content || "",
    }
  } catch {
    return null
  }
}