import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import type { Adapter } from "next-auth/adapters"
import bcrypt from "bcryptjs"
import prisma from "@/lib/db"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { workspace: true },
        })

        if (!user) {
          return null
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash)

        if (!isValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          workspaceId: user.workspaceId,
          workspaceName: user.workspace.name,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.workspaceId = user.workspaceId
        token.workspaceName = user.workspaceName
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        const userId = token.sub ?? session.user.id
        session.user.id = userId
        session.user.role = token.role
        session.user.workspaceId = token.workspaceId
        session.user.workspaceName = token.workspaceName

        try {
          const dbUser = userId
            ? await prisma.user.findUnique({
                where: { id: userId },
                select: {
                  name: true,
                  email: true,
                  role: true,
                  workspaceId: true,
                  workspace: {
                    select: { name: true },
                  },
                },
              })
            : null

          if (dbUser) {
            session.user.name = dbUser.name
            session.user.email = dbUser.email
            session.user.role = dbUser.role
            session.user.workspaceId = dbUser.workspaceId
            session.user.workspaceName = dbUser.workspace.name
          }
        } catch (error) {
          console.error("Failed to load session user from database:", error)
        }
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.AUTH_SECRET,
}