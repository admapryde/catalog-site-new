import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  providers: [], // Используем Supabase Auth напрямую, а не через NextAuth провайдеры
  callbacks: {
    async authorized({ auth, request: { nextUrl } }) {
      // Для упрощения, мы не будем использовать NextAuth для проверки авторизации
      // Вместо этого будем использовать middleware.ts
      return true;
    }
  },
  // Отключаем сессии NextAuth, так как используем Supabase Auth
  session: {
    strategy: 'jwt',
  }
} satisfies NextAuthConfig