import prisma from "@/lib/db"

export async function getWorkspaceStats(workspaceId: string) {
  const [totalFeedback, positiveCount, negativeCount, openIssues, activeThemes, recentFeedback] =
    await Promise.all([
      prisma.feedback.count({ where: { workspaceId } }),
      prisma.feedback.count({ where: { workspaceId, sentiment: "POSITIVE" } }),
      prisma.feedback.count({ where: { workspaceId, sentiment: "NEGATIVE" } }),
      prisma.feedback.count({ where: { workspaceId, status: { in: ["NEW", "REVIEWED"] } } }),
      prisma.theme.count({ where: { workspaceId } }),
      prisma.feedback.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { themes: { include: { theme: true } } },
      }),
    ])

  const positivePercent = totalFeedback > 0 ? Math.round((positiveCount / totalFeedback) * 100) : 0
  const negativePercent = totalFeedback > 0 ? Math.round((negativeCount / totalFeedback) * 100) : 0

  return {
    totalFeedback,
    positivePercent,
    negativePercent,
    openIssues,
    activeThemes,
    recentFeedback,
  }
}

export async function getSentimentOverTime(workspaceId: string, days: number = 30) {
  const now = new Date()
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

  const feedback = await prisma.feedback.findMany({
    where: {
      workspaceId,
      createdAt: { gte: startDate },
    },
    orderBy: { createdAt: "asc" },
    select: { sentiment: true, createdAt: true },
  })

  const grouped: Record<string, { positive: number; neutral: number; negative: number }> = {}

  feedback.forEach((f) => {
    const date = f.createdAt.toISOString().split("T")[0]
    if (!grouped[date]) {
      grouped[date] = { positive: 0, neutral: 0, negative: 0 }
    }
    if (f.sentiment === "POSITIVE") grouped[date].positive++
    else if (f.sentiment === "NEGATIVE") grouped[date].negative++
    else grouped[date].neutral++
  })

  return Object.entries(grouped).map(([date, data]) => ({
    date,
    ...data,
  }))
}

export async function getFeedbackBySource(workspaceId: string) {
  const sources = await prisma.feedback.groupBy({
    by: ["source"],
    where: { workspaceId },
    _count: { id: true },
  })

  return sources.map((s) => ({
    source: s.source,
    count: s._count.id,
  }))
}

export async function getTopThemes(workspaceId: string, limit: number = 6) {
  return prisma.theme.findMany({
    where: { workspaceId },
    orderBy: { feedbackCount: "desc" },
    take: limit,
    select: {
      name: true,
      feedbackCount: true,
      positiveCount: true,
      negativeCount: true,
      trendScore: true,
    },
  })
}

export async function getSentimentDistribution(workspaceId: string) {
  const dist = await prisma.feedback.groupBy({
    by: ["sentiment"],
    where: { workspaceId },
    _count: { id: true },
  })

  return dist.map((d) => ({
    sentiment: d.sentiment,
    count: d._count.id,
  }))
}
