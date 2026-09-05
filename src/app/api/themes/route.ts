import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireAuth } from "@/lib/auth/helpers"

export async function GET() {
  try {
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const workspaceId = user.workspaceId

    const themes = await prisma.theme.findMany({
      where: { workspaceId },
      orderBy: { feedbackCount: "desc" },
      include: {
        feedbacks: {
          select: {
            feedback: {
              select: {
                id: true,
                sentiment: true,
              },
            },
          },
          take: 5,
        },
      },
    })

    return NextResponse.json(themes)
  } catch (error) {
    console.error("Themes error:", error)
    return NextResponse.json(
      { error: "Unable to load themes" },
      { status: 500 }
    )
  }
}