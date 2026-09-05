"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "cn"
import {
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  Layers,
  MessageCircle,
  FileText,
  Settings,
  LogOut,
  Sparkles,
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Feedback", href: "/feedback", icon: MessageSquare },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Themes", href: "/themes", icon: Layers },
  { name: "Ask LOOP", href: "/ask-loop", icon: MessageCircle },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
]

interface SidebarProps {
  user?: {
    name: string
    email: string
    role: string
    workspaceName: string
  }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col border-r bg-white">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight">LOOP</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-violet-50 text-violet-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {user && (
        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-sm font-medium text-violet-700">
              {user.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.role}</p>
            </div>
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
