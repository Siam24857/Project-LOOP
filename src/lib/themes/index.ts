import prisma from "@/lib/db"
import type { Sentiment } from "@prisma/client"

export async function assignThemeToFeedback(
  feedbackId: string,
  workspaceId: string,
  themeName: string,
  sentiment: Sentiment
) {
  const theme = await prisma.theme.upsert({
    where: {
      workspaceId_name: { workspaceId, name: themeName },
    },
    create: {
      workspaceId,
      name: themeName,
      description: `Auto-detected theme: ${themeName}`,
      feedbackCount: 0,
    },
    update: {},
  })

  await prisma.feedbackTheme.upsert({
    where: {
      feedbackId_themeId: { feedbackId, themeId: theme.id },
    },
    create: { feedbackId, themeId: theme.id },
    update: {},
  })

  const sentimentData =
    sentiment === "POSITIVE"
      ? { positiveCount: { increment: 1 } }
      : sentiment === "NEGATIVE"
        ? { negativeCount: { increment: 1 } }
        : {}

  await prisma.theme.update({
    where: { id: theme.id },
    data: { feedbackCount: { increment: 1 }, ...sentimentData },
  })

  return theme
}

export async function assignThemesToFeedback(
  feedbackId: string,
  workspaceId: string,
  themeNames: string[],
  sentiment: Sentiment
) {
  const uniqueNames = Array.from(new Set(themeNames.map((n) => n.trim()).filter(Boolean)))
  const themes = []
  for (const name of uniqueNames) {
    themes.push(await assignThemeToFeedback(feedbackId, workspaceId, name, sentiment))
  }
  return themes
}

export async function recomputeThemeStats(workspaceId: string) {
  const themes = await prisma.theme.findMany({ where: { workspaceId } })

  for (const theme of themes) {
    const associations = await prisma.feedbackTheme.findMany({
      where: { themeId: theme.id },
      select: { feedback: { select: { sentiment: true } } },
    })

    const positiveCount = associations.filter((a) => a.feedback.sentiment === "POSITIVE").length
    const negativeCount = associations.filter((a) => a.feedback.sentiment === "NEGATIVE").length

    await prisma.theme.update({
      where: { id: theme.id },
      data: {
        feedbackCount: associations.length,
        positiveCount,
        negativeCount,
        trendScore: associations.length > 0
          ? parseFloat(((positiveCount - negativeCount) / associations.length).toFixed(2))
          : 0,
      },
    })
  }
}