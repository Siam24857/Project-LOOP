import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireRole } from "@/lib/auth/helpers"
import Papa from "papaparse"
import type { Prisma } from "@prisma/client"

type CsvRow = Record<string, string | undefined>

interface InvalidRow {
  row: number
  errors: string[]
}

const VALID_SOURCES = ["SUPPORT", "APP_REVIEW", "SURVEY", "SALES", "MANUAL", "SIMULATED"]
const SOURCE_MAP: Record<string, string> = {
  support: "SUPPORT",
  app_review: "APP_REVIEW",
  "app review": "APP_REVIEW",
  appreview: "APP_REVIEW",
  survey: "SURVEY",
  sales: "SALES",
  manual: "MANUAL",
  simulated: "SIMULATED",
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "ANALYST"])
    if (!user) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { csvData, confirm } = body as { csvData?: string; confirm?: boolean }

    if (!csvData || typeof csvData !== "string") {
      return NextResponse.json({ error: "No CSV data provided" }, { status: 400 })
    }

    const parsed = Papa.parse<CsvRow>(csvData, {
      header: true,
      skipEmptyLines: true,
    })

    const validRows: Prisma.FeedbackCreateManyInput[] = []
    const invalidRows: InvalidRow[] = []

    parsed.data.forEach((row, index) => {
      const errors: string[] = []

      const content = (row.content || row.feedback || row.text || "").trim()
      if (!content || content.length < 5) {
        errors.push("Content must be at least 5 characters")
      }

      const customerName = (row.customer_name || row.customerName || row.name || "Anonymous").trim()
      const customerEmail = (row.customer_email || row.customerEmail || row.email || "").trim()

      const rawSource = (row.source || "MANUAL").trim().toLowerCase()
      const source = SOURCE_MAP[rawSource] || rawSource.toUpperCase()
      const normalizedSource = VALID_SOURCES.includes(source)
        ? source
        : "MANUAL"

      const createdAt = row.created_at ? new Date(row.created_at) : new Date()
      if (Number.isNaN(createdAt.getTime())) {
        errors.push("created_at is not a valid date")
      }

      if (errors.length > 0) {
        invalidRows.push({ row: index + 1, errors })
      } else {
        validRows.push({
          workspaceId: user.workspaceId,
          source: normalizedSource as Prisma.FeedbackCreateManyInput["source"],
          customerName,
          customerEmail,
          content,
          sentiment: "NEUTRAL",
          status: "NEW",
          priority: "MEDIUM",
          language: "en",
          createdAt,
        })
      }
    })

    if (!confirm) {
      return NextResponse.json({
        preview: {
          validCount: validRows.length,
          invalidCount: invalidRows.length,
          errors: invalidRows.slice(0, 10),
          sampleData: validRows.slice(0, 3).map((r) => ({
            source: r.source,
            customerName: r.customerName,
            customerEmail: r.customerEmail,
            content: r.content,
            createdAt: r.createdAt,
          })),
        },
      })
    }

    if (validRows.length === 0) {
      return NextResponse.json({ error: "No valid rows to import" }, { status: 400 })
    }

    const created = await prisma.feedback.createMany({ data: validRows })

    return NextResponse.json({
      message: `Successfully imported ${created.count} feedback items`,
      imported: created.count,
      invalid: invalidRows.length,
    })
  } catch (error) {
    console.error("CSV import error:", error)
    return NextResponse.json({ error: "Unable to import CSV data" }, { status: 500 })
  }
}