import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireAuth, requireRole } from "@/lib/auth/helpers"
import { feedbackUpdateSchema } from "@/lib/validation"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const feedback = await prisma.feedback.findFirst({
      where: { id, workspaceId: user.workspaceId },
      include: {
        themes: {
          include: { theme: { select: { id: true, name: true, description: true } } },
        },
      },
    })

    if (!feedback) {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 })
    }

    return NextResponse.json(feedback)
  } catch (error) {
    console.error("Feedback detail error:", error)
    return NextResponse.json({ error: "Unable to load feedback" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(["ADMIN", "ANALYST"])
    if (!user) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const result = feedbackUpdateSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const existing = await prisma.feedback.findFirst({
      where: { id, workspaceId: user.workspaceId },
    })

    if (!existing) {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 })
    }

    const feedback = await prisma.feedback.update({
      where: { id },
      data: result.data,
    })

    return NextResponse.json(feedback)
  } catch (error) {
    console.error("Feedback update error:", error)
    return NextResponse.json({ error: "Unable to update feedback" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole("ADMIN")
    if (!user) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params

    const existing = await prisma.feedback.findFirst({
      where: { id, workspaceId: user.workspaceId },
    })

    if (!existing) {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 })
    }

    await prisma.feedback.delete({ where: { id } })

    return NextResponse.json({ message: "Feedback deleted" })
  } catch (error) {
    console.error("Feedback delete error:", error)
    return NextResponse.json({ error: "Unable to delete feedback" }, { status: 500 })
  }
}