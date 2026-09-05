"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"

type Role = "ADMIN" | "ANALYST" | "VIEWER"

const roleColors: Record<string, string> = {
  ADMIN: "bg-violet-100 text-violet-700",
  ANALYST: "bg-blue-100 text-blue-700",
  VIEWER: "bg-gray-100 text-gray-700",
}

interface TeamMember {
  id: string
  name: string
  email: string
  role: Role
  createdAt: string
}

export default function TeamPage() {
  const { data: session } = useSession()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch("/api/settings/team")
        if (res.ok && !cancelled) {
          setMembers((await res.json()) as TeamMember[])
        }
      } catch (err) {
        if (!cancelled) console.error(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await fetch("/api/settings/team", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newRole }),
      })
      if (res.ok) {
        const updated = (await res.json()) as TeamMember
        setMembers((prev) => prev.map((m) => (m.id === updated.id ? { ...m, role: updated.role } : m)))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const isAdmin = session?.user?.role === "ADMIN"

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Team</h1>
        <p className="text-sm text-gray-500">Manage workspace members and roles</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-sm font-medium text-violet-700">
                      {member.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{member.name}</p>
                      <p className="text-xs text-gray-500">{member.email}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Joined {formatDate(member.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isAdmin ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value)}
                        className="rounded-lg border bg-gray-50 px-2 py-1.5 text-xs font-medium focus:border-violet-500 focus:outline-none"
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="ANALYST">Analyst</option>
                        <option value="VIEWER">Viewer</option>
                      </select>
                    ) : (
                      <Badge className={`text-xs ${roleColors[member.role] || ""}`}>{member.role}</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}