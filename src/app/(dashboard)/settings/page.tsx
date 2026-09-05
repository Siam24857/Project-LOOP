"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Save, Loader2 } from "lucide-react"

interface WorkspaceSettings {
  id: string
  name: string
  slug: string
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const [workspaceName, setWorkspaceName] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch("/api/settings/workspace")
        if (res.ok && !cancelled) {
          const data = (await res.json()) as WorkspaceSettings
          setWorkspaceName(data.name)
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch("/api/settings/workspace", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: workspaceName }),
      })

      const body = (await res.json()) as { error?: string; name?: string }

      if (!res.ok) {
        setMessage({ type: "error", text: body.error || "Unable to save settings." })
        return
      }

      setMessage({ type: "success", text: "Workspace settings saved successfully." })
    } catch {
      setMessage({ type: "error", text: "Network error while saving settings." })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-gray-500">Workspace settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Workspace Name</label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={80}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Role</label>
                <input
                  type="text"
                  value={session?.user?.role || ""}
                  readOnly
                  className="w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="text"
                  value={session?.user?.email || ""}
                  readOnly
                  className="w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving || workspaceName.trim().length < 2}
                  className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>

              {message && (
                <div
                  className={`rounded-lg p-3 text-sm ${
                    message.type === "success"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {message.text}
                </div>
              )}
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}