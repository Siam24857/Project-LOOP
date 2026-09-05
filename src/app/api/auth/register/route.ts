import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import prisma from "@/lib/db"
import { registerSchema } from "@/lib/validation"
import { slugify } from "@/lib/utils"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = registerSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { name, email, password, workspaceName } = result.data

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const slug = slugify(workspaceName)
    let finalSlug = slug
    let counter = 1
    while (await prisma.workspace.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${counter}`
      counter++
    }

    const workspace = await prisma.workspace.create({
      data: {
        name: workspaceName,
        slug: finalSlug,
      },
    })

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "ADMIN",
        workspaceId: workspace.id,
      },
    })

    return NextResponse.json(
      {
        message: "Account created successfully",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Unable to create account. Please try again." },
      { status: 500 }
    )
  }
}
