import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireRole } from "@/lib/auth/helpers"
import { generateVoCReport } from "@/lib/ai/report"
import { isBillingError, billingErrorResponse } from "@/lib/ai/client"
import type { Prisma } from "@prisma/client"

export async function POST() {
  try {
    const user = await requireRole(["ADMIN", "ANALYST"])
    if (!user) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const workspaceId = user.workspaceId

    const report = await generateVoCReport(workspaceId)
    if (!report) {
      throw new Error("Report generation returned no result")
    }

    const savedReport = await prisma.report.create({
      data: {
        workspaceId,
        title: report.title,
        summary: report.summary,
        content: report.content,
        reportData: report.reportData as unknown as Prisma.InputJsonValue,
      },
    })

    return NextResponse.json(savedReport, { status: 201 })
  } catch (error) {
    console.error("Report generation error:", error)
    if (isBillingError(error)) {
      return NextResponse.json(billingErrorResponse(), { status: 502 })
    }
    return NextResponse.json(
      { error: "Unable to generate report" },
      { status: 500 }
    )
  }
}