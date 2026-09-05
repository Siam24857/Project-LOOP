import { Sidebar } from "./sidebar"
import { MobileSidebar } from "./mobile-sidebar"
import { Header } from "./header"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  const user = {
    name: session.user.name || "User",
    email: session.user.email || "",
    role: session.user.role,
    workspaceName: session.user.workspaceName || "Workspace",
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <div className="hidden lg:flex">
        <Sidebar user={user} />
      </div>
      <MobileSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
