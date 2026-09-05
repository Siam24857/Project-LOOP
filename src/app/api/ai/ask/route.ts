import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/helpers"
import { askLoopSchema } from "@/lib/validation"
import { askLoop } from "@/lib/ai/ask"
import { isBillingError, billingErrorResponse } from "@/lib/ai/client"

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const workspaceId = user.workspaceId
    const body = await request.json()
    const result = askLoopSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const response = await askLoop(result.data.question, workspaceId)

    return NextResponse.json(response)
  } catch (error) {
    console.error("Ask LOOP error:", error)
    if (isBillingError(error)) {
      return NextResponse.json(billingErrorResponse(), { status: 502 })
    }
    return NextResponse.json(
      { error: "Unable to answer question. Please try again." },
      { status: 500 }
    )
  }
}