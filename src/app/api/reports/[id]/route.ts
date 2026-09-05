import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireAuth, requireRole } from "@/lib/auth/helpers"

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

    const report = await prisma.report.findFirst({
      where: { id, workspaceId },
    })

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error("Report detail error:", error)
    return NextResponse.json(
      { error: "Unable to load report" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole("ADMIN")
    if (!user) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const workspaceId = user.workspaceId

    const report = await prisma.report.findFirst({
      where: { id, workspaceId },
    })

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    await prisma.report.delete({ where: { id } })

    return NextResponse.json({ message: "Report deleted" })
  } catch (error) {
    console.error("Report delete error:", error)
    return NextResponse.json(
      { error: "Unable to delete report" },
      { status: 500 }
    )
  }
}