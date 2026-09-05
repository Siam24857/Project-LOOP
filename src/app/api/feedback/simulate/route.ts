import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireRole } from "@/lib/auth/helpers"
import type { FeedbackSource, Sentiment } from "@prisma/client"

interface SimulatedSeed {
  source: FeedbackSource
  content: string
  sentiment: Sentiment
  customerName: string
}

const simulatedFeedback: SimulatedSeed[] = [
  { source: "SUPPORT", content: "I've been waiting 3 days for a response to my support ticket. This is unacceptable.", sentiment: "NEGATIVE", customerName: "Sarah Chen" },
  { source: "APP_REVIEW", content: "Love the new dashboard! It's so much easier to find what I need.", sentiment: "POSITIVE", customerName: "James Wilson" },
  { source: "SURVEY", content: "The checkout process is too complicated. I almost gave up halfway through.", sentiment: "NEGATIVE", customerName: "Maria Garcia" },
  { source: "SALES", content: "Prospect mentioned they need better reporting features before they can switch.", sentiment: "NEUTRAL", customerName: "Robert Kim" },
  { source: "APP_REVIEW", content: "The mobile app crashes every time I try to upload a photo.", sentiment: "NEGATIVE", customerName: "Alex Thompson" },
  { source: "SUPPORT", content: "Thank you for the quick resolution! My issue was fixed within an hour.", sentiment: "POSITIVE", customerName: "Emily Davis" },
  { source: "SURVEY", content: "The new pricing model is much clearer than before. Good job!", sentiment: "POSITIVE", customerName: "Michael Brown" },
  { source: "MANUAL", content: "Customer mentioned during interview that they need bulk export functionality.", sentiment: "NEUTRAL", customerName: "Lisa Anderson" },
  { source: "APP_REVIEW", content: "Dark mode is broken on iOS. Text is invisible on some screens.", sentiment: "NEGATIVE", customerName: "David Lee" },
  { source: "SUPPORT", content: "The integration with Slack stopped working after the last update.", sentiment: "NEGATIVE", customerName: "Jennifer Martinez" },
  { source: "SURVEY", content: "I would rate this product 9 out of 10. Excellent experience overall.", sentiment: "POSITIVE", customerName: "Chris Taylor" },
  { source: "SALES", content: "Competitor is offering similar features at half the price. Need to address.", sentiment: "NEGATIVE", customerName: "Amanda White" },
  { source: "APP_REVIEW", content: "The search feature is lightning fast now. Great improvement!", sentiment: "POSITIVE", customerName: "Kevin Johnson" },
  { source: "SUPPORT", content: "Cannot log in with my Google account. Getting a 403 error.", sentiment: "NEGATIVE", customerName: "Rachel Green" },
  { source: "MANUAL", content: "During the onboarding call, customer praised the intuitive UI design.", sentiment: "POSITIVE", customerName: "Tom Harris" },
]

export async function POST() {
  try {
    const user = await requireRole(["ADMIN", "ANALYST"])
    if (!user) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const random = simulatedFeedback[Math.floor(Math.random() * simulatedFeedback.length)]

    const feedback = await prisma.feedback.create({
      data: {
        workspaceId: user.workspaceId,
        source: random.source,
        customerName: random.customerName,
        customerEmail: `${random.customerName.toLowerCase().replace(/\s+/g, ".")}@example.com`,
        content: random.content,
        sentiment: random.sentiment,
        status: "NEW",
        priority: "MEDIUM",
        language: "en",
      },
    })

    return NextResponse.json(feedback, { status: 201 })
  } catch (error) {
    console.error("Simulate feedback error:", error)
    return NextResponse.json({ error: "Unable to simulate feedback" }, { status: 500 })
  }
}