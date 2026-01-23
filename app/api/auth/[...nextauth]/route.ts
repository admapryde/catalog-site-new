import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { authConfig } from "../../../../auth.config"
import { createClient } from "@/lib/supabase-server"

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
        const supabase = await createClient()

        // Прямая аутентификация через Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials?.email as string,
          password: credentials?.password as string
        })

        if (error || !data.user) {
          console.error('Ошибка аутентификации в Supabase:', error)
          return null
        }

        // Проверяем, что пользователь является администратором
        const userRole = data.user.user_metadata?.role || 'user'
        if (userRole !== 'admin' && userRole !== 'super_admin') {
          console.log('Пользователь не является администратором')
          return null
        }

        // Возвращаем данные пользователя
        return {
          id: data.user.id,
          name: data.user.email,
          email: data.user.email || "",
          role: userRole
        }
      }
    })
  ],
  secret: process.env.AUTH_SECRET,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  // Отключаем автоматические стратегии сессий, чтобы использовать Supabase
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 дней
  }
})