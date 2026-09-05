import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireAuth, requireRole } from "@/lib/auth/helpers"
import type { Role } from "@prisma/client"

export async function GET() {
  try {
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const workspaceId = user.workspaceId

    const users = await prisma.user.findMany({
      where: { workspaceId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("Team list error:", error)
    return NextResponse.json(
      { error: "Unable to load team" },
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

    const workspaceId = user.workspaceId
    const body = await request.json()
    const { userId, newRole } = body as { userId?: string; newRole?: string }

    if (!userId || !newRole) {
      return NextResponse.json(
        { error: "userId and newRole are required" },
        { status: 400 }
      )
    }

    if (!["ADMIN", "ANALYST", "VIEWER"].includes(newRole)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      )
    }

    const targetUser = await prisma.user.findFirst({
      where: { id: userId, workspaceId },
    })

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole as Role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Team update error:", error)
    return NextResponse.json(
      { error: "Unable to update team member" },
      { status: 500 }
    )
  }
}