import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      role: "ADMIN" | "ANALYST" | "VIEWER"
      workspaceId: string
      workspaceName: string
    }
  }

  interface User {
    role: "ADMIN" | "ANALYST" | "VIEWER"
    workspaceId: string
    workspaceName: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "ADMIN" | "ANALYST" | "VIEWER"
    workspaceId: string
    workspaceName: string
  }
}