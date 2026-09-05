import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireAuth } from "@/lib/auth/helpers"
import { feedbackSchema } from "@/lib/validation"
import { Prisma } from "@prisma/client"

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const workspaceId = user.workspaceId
    const { searchParams } = new URL(request.url)

    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20")))
    const search = searchParams.get("search")?.trim() || ""
    const source = searchParams.get("source") || ""
    const sentiment = searchParams.get("sentiment") || ""
    const status = searchParams.get("status") || ""
    const category = searchParams.get("category") || ""
    const from = searchParams.get("from") || ""
    const to = searchParams.get("to") || ""
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    const where: Prisma.FeedbackWhereInput = { workspaceId }

    if (search) {
      where.OR = [
        { content: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { customerEmail: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
        { themes: { some: { theme: { name: { contains: search, mode: "insensitive" } } } } },
      ]
    }

    if (source) where.source = source as Prisma.FeedbackWhereInput["source"]
    if (sentiment) where.sentiment = sentiment as Prisma.FeedbackWhereInput["sentiment"]
    if (status) where.status = status as Prisma.FeedbackWhereInput["status"]
    if (category) where.category = category
    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) where.createdAt.lte = new Date(to)
    }

    const allowedSortFields = ["createdAt", "updatedAt", "customerName", "priority"]
    const orderByField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt"
    const orderBy: Prisma.FeedbackOrderByWithRelationInput = {
      [orderByField]: sortOrder === "asc" ? "asc" : "desc",
    }

    const [data, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          themes: {
            include: { theme: { select: { id: true, name: true } } },
          },
        },
      }),
      prisma.feedback.count({ where }),
    ])

    return NextResponse.json({
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error("Feedback list error:", error)
    return NextResponse.json({ error: "Unable to load feedback" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.role === "VIEWER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const result = feedbackSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const feedback = await prisma.feedback.create({
      data: {
        workspaceId: user.workspaceId,
        source: result.data.source,
        customerName: result.data.customerName,
        customerEmail: result.data.customerEmail || "",
        content: result.data.content,
        priority: result.data.priority,
        sentiment: "NEUTRAL",
        status: "NEW",
      },
    })

    return NextResponse.json(feedback, { status: 201 })
  } catch (error) {
    console.error("Feedback create error:", error)
    return NextResponse.json({ error: "Unable to create feedback" }, { status: 500 })
  }
}