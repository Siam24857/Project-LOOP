import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const user = {
    name: session.user.name || "User",
    email: session.user.email || "",
    role: session.user.role,
    workspaceName: session.user.workspaceName || "Workspace",
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <div className="hidden lg:flex lg:flex-shrink-0">
        <SidebarContent user={user} />
      </div>
      <MobileSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="pl-16 lg:pl-0">
          <HeaderContent />
        </div>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

import { Sidebar as SidebarContent } from "@/components/layout/sidebar";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { Header as HeaderContent } from "@/components/layout/header";