import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireAuth } from "@/lib/auth/helpers"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const workspaceId = user.workspaceId

    const theme = await prisma.theme.findFirst({
      where: { id, workspaceId },
      include: {
        feedbacks: {
          include: {
            feedback: {
              select: {
                id: true,
                content: true,
                sentiment: true,
                source: true,
                customerName: true,
                createdAt: true,
              },
            },
          },
          orderBy: { feedback: { createdAt: "desc" } },
        },
      },
    })

    if (!theme) {
      return NextResponse.json({ error: "Theme not found" }, { status: 404 })
    }

    return NextResponse.json(theme)
  } catch (error) {
    console.error("Theme detail error:", error)
    return NextResponse.json(
      { error: "Unable to load theme" },
      { status: 500 }
    )
  }
}