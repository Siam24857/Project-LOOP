import { getServerSession } from "next-auth"
import { authOptions } from "./options"
import { NextResponse } from "next/server"
import type { SessionUser } from "@/types"

export async function requireAuth(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions)
  const user = session?.user as SessionUser | undefined
  if (!user?.id || !user.workspaceId) {
    return null
  }
  return user
}

export async function requireRole(roles: string | string[]): Promise<SessionUser | null> {
  const user = await requireAuth()
  if (!user) return null

  const allowedRoles = Array.isArray(roles) ? roles : [roles]

  if (!allowedRoles.includes(user.role)) {
    return null
  }

  return user
}

export function getCurrentWorkspaceId(user: SessionUser): string {
  return user.workspaceId
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

export function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 })
}