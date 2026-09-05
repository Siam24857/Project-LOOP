"use client"

import { useState } from "react"
import { Search, Bell } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export function Header() {
  const { data: session } = useSession()
  const router = useRouter()
  const [query, setQuery] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    router.push(`/feedback?search=${encodeURIComponent(trimmed)}`)
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <form onSubmit={handleSearch} className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search feedback..."
            className="h-9 w-64 rounded-lg border bg-gray-50 pl-10 pr-4 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>
      </form>

      <div className="flex items-center gap-4">
        <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-sm font-medium text-violet-700">
            {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium">{session?.user?.name || "User"}</p>
            <p className="text-xs text-gray-500">{session?.user?.workspaceName || "Workspace"}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
