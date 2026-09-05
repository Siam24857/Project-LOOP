import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireRole } from "@/lib/auth/helpers"
import { detectThemes } from "@/lib/ai/themes"
import { isBillingError, billingErrorResponse } from "@/lib/ai/client"

export async function POST() {
  try {
    const user = await requireRole(["ADMIN", "ANALYST"])
    if (!user) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const workspaceId = user.workspaceId

    const feedbacks = await prisma.feedback.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        content: true,
        sentiment: true,
      },
    })

    if (feedbacks.length === 0) {
      return NextResponse.json(
        { error: "No feedback to analyze" },
        { status: 400 }
      )
    }

    const detectedThemes = await detectThemes(feedbacks.map((f) => f.content))

    const createdThemes = []
    for (const theme of detectedThemes) {
      const existing = await prisma.theme.findFirst({
        where: { workspaceId, name: theme.name },
      })

      if (!existing) {
        const newTheme = await prisma.theme.create({
          data: {
            workspaceId,
            name: theme.name,
            description: theme.description,
            feedbackCount: 0,
          },
        })
        createdThemes.push(newTheme)
      } else {
        createdThemes.push(existing)
      }
    }

    return NextResponse.json({
      themes: createdThemes,
      message: `Detected ${detectedThemes.length} themes`,
    })
  } catch (error) {
    console.error("AI themes error:", error)
    if (isBillingError(error)) {
      return NextResponse.json(billingErrorResponse(), { status: 502 })
    }
    return NextResponse.json(
      { error: "Unable to detect themes" },
      { status: 500 }
    )
  }
}