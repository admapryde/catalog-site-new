import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import type { NextAuthConfig } from 'next-auth'

// Простая конфигурация для демонстрации
const authConfig: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // Здесь должна быть ваша логика аутентификации
        // В демонстрационных целях просто возвращаем объект пользователя
        return {
          id: '1',
          name: credentials?.username,
          email: `${credentials?.username}@example.com`
        }
      }
    })
  ],
  secret: process.env.AUTH_SECRET,
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      // Проверяем, авторизован ли пользователь при доступе к админке
      const isLoggedIn = !!auth?.user
      const isOnAdmin = nextUrl.pathname.startsWith('/admin')

      if (isOnAdmin) {
        if (isLoggedIn) return true
        return false // Перенаправит на страницу входа
      }

      return true
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
      }
      return session
    }
  }
}

export { authConfig }
export default NextAuth(authConfig)