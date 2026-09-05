import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireRole } from "@/lib/auth/helpers"
import { classifyFeedback } from "@/lib/ai/classify"
import { assignThemesToFeedback } from "@/lib/themes"
import { storeFeedbackEmbedding } from "@/lib/embeddings"
import { isBillingError, billingErrorResponse } from "@/lib/ai/client"
import type { Sentiment, Priority } from "@prisma/client"

export async function POST(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "ANALYST"])
    if (!user) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const workspaceId = user.workspaceId
    const body = await request.json()
    const { feedbackId } = body

    if (!feedbackId || typeof feedbackId !== "string") {
      return NextResponse.json(
        { error: "feedbackId is required" },
        { status: 400 }
      )
    }

    const feedback = await prisma.feedback.findFirst({
      where: { id: feedbackId, workspaceId },
    })

    if (!feedback) {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 })
    }

    const classification = await classifyFeedback(feedback.content)

    const sentimentMap: Record<string, Sentiment> = {
      positive: "POSITIVE",
      negative: "NEGATIVE",
      neutral: "NEUTRAL",
    }

    const priorityMap: Record<string, Priority> = {
      low: "LOW",
      medium: "MEDIUM",
      high: "HIGH",
      urgent: "URGENT",
    }

    const updatedFeedback = await prisma.feedback.update({
      where: { id: feedbackId },
      data: {
        sentiment: sentimentMap[classification.sentiment] || "NEUTRAL",
        category: classification.category,
        priority: priorityMap[classification.priority] || "MEDIUM",
      },
    })

    if (classification.themes && classification.themes.length > 0) {
      await assignThemesToFeedback(
        feedbackId,
        workspaceId,
        classification.themes,
        updatedFeedback.sentiment
      )
    }

    await storeFeedbackEmbedding(feedbackId, workspaceId)

    return NextResponse.json({
      classification,
      feedback: updatedFeedback,
    })
  } catch (error) {
    console.error("AI classify error:", error)
    if (isBillingError(error)) {
      return NextResponse.json(billingErrorResponse(), { status: 502 })
    }
    return NextResponse.json(
      { error: "Unable to classify feedback" },
      { status: 500 }
    )
  }
}