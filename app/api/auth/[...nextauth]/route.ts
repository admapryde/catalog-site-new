import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { authConfig } from "../../../../auth.config"
import { authenticateAdmin } from "@/services/admin-auth-service"

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const user = await authenticateAdmin(
          credentials?.email as string,
          credentials?.password as string
        )

        if (user) {
          return {
            id: user.id,
            name: user.email, // используем email как имя, так как username отсутствует
            email: user.email || "",
            role: user.role
          }
        }

        return null
      }
    })
  ],
  secret: process.env.AUTH_SECRET,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        if ('role' in user) {
          token.role = user.role
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        if ('role' in token) {
          session.user.role = token.role as string
        }
      }
      return session
    }
  }
})