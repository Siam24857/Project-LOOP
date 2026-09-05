import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/helpers"
import {
  getWorkspaceStats,
  getSentimentOverTime,
  getFeedbackBySource,
  getTopThemes,
  getSentimentDistribution,
} from "@/lib/analytics"

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const workspaceId = user.workspaceId
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get("days") || "30")

    const [stats, sentimentOverTime, sourceBreakdown, topThemes, sentimentDistribution] =
      await Promise.all([
        getWorkspaceStats(workspaceId),
        getSentimentOverTime(workspaceId, days),
        getFeedbackBySource(workspaceId),
        getTopThemes(workspaceId),
        getSentimentDistribution(workspaceId),
      ])

    return NextResponse.json({
      stats,
      sentimentOverTime,
      sourceBreakdown,
      topThemes,
      sentimentDistribution,
    })
  } catch (error) {
    console.error("Analytics error:", error)
    return NextResponse.json(
      { error: "Unable to load analytics" },
      { status: 500 }
    )
  }
}