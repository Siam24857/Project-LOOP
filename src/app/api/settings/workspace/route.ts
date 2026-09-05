import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireAuth, requireRole } from "@/lib/auth/helpers"

export async function GET() {
  try {
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: user.workspaceId },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            feedbacks: true,
            reports: true,
          },
        },
      },
    })

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    return NextResponse.json(workspace)
  } catch (error) {
    console.error("Workspace settings error:", error)
    return NextResponse.json(
      { error: "Unable to load workspace settings" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireRole("ADMIN")
    if (!user) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const name = typeof body?.name === "string" ? body.name.trim() : ""

    if (!name || name.length < 2 || name.length > 80) {
      return NextResponse.json(
        { error: "Workspace name must be between 2 and 80 characters" },
        { status: 400 }
      )
    }

    const workspace = await prisma.workspace.update({
      where: { id: user.workspaceId },
      data: { name },
      select: { id: true, name: true, slug: true },
    })

    return NextResponse.json(workspace)
  } catch (error) {
    console.error("Workspace update error:", error)
    return NextResponse.json(
      { error: "Unable to update workspace settings" },
      { status: 500 }
    )
  }
}