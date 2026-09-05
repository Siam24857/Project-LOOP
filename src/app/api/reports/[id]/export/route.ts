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
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "csv"

    const report = await prisma.report.findFirst({
      where: { id, workspaceId },
    })

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    if (format === "markdown") {
      const markdown = `# ${report.title}

> Generated: ${report.createdAt.toISOString()}

## Executive Summary

${report.summary}

## Report

${report.content ?? "No content available."}
`
      const fileName = `${report.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "report"}.md`
      return new NextResponse(markdown, {
        status: 200,
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="${fileName}"`,
        },
      })
    }

    if (format !== "csv") {
      return NextResponse.json(
        { error: "Unsupported format. Use format=csv or format=markdown" },
        { status: 400 }
      )
    }

    const feedback = await prisma.feedback.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 5000,
      select: {
        createdAt: true,
        customerName: true,
        customerEmail: true,
        source: true,
        sentiment: true,
        status: true,
        priority: true,
        category: true,
        content: true,
      },
    })

    const headers = [
      "created_at",
      "customer_name",
      "customer_email",
      "source",
      "sentiment",
      "status",
      "priority",
      "category",
      "content",
    ]

    const escapeCsv = (value: string | Date | null | undefined): string => {
      if (value === null || value === undefined) return ""
      const str = value instanceof Date ? value.toISOString() : String(value)
      if (/[",\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    const lines = [
      headers.join(","),
      ...feedback.map((row) =>
        headers.map((h) => escapeCsv(row[h as keyof typeof row])).join(",")
      ),
    ]

    const csv = lines.join("\r\n")
    const fileName = `loop-report-${report.id.slice(0, 8)}.csv`

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    console.error("Report export error:", error)
    return NextResponse.json(
      { error: "Unable to export report" },
      { status: 500 }
    )
  }
}