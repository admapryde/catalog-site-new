import type { NextAuthConfig } from 'next-auth'

// Проверяем, есть ли конфигурация Supabase
const hasSupabaseConfig =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('your_supabase_url_here') &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() &&
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.includes('your_supabase_anon_key_here');

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  providers: hasSupabaseConfig ? [] : [], // В моковом режиме не используем провайдеры
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnAdmin = nextUrl.pathname.startsWith('/admin')

      if (isOnAdmin) {
        if (isLoggedIn) return true
        return false // Перенаправит на страницу входа
      }

      return true
    },
  },
} satisfies NextAuthConfig