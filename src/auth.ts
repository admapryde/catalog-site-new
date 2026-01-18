import NextAuth from 'next-auth'
import { authConfig } from '@/app/auth.config'

// Проверяем, есть ли конфигурация Supabase
const hasSupabaseConfig =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('your_supabase_url_here') &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() &&
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.includes('your_supabase_anon_key_here');

let nextAuthInstance;

if (hasSupabaseConfig) {
  // Используем реальную конфигурацию NextAuth
  nextAuthInstance = NextAuth(authConfig);
} else {
  // Создаем заглушку для NextAuth при отсутствии конфигурации Supabase
  nextAuthInstance = {
    handlers: {
      GET: () => new Response('NextAuth is disabled', { status: 503 }),
      POST: () => new Response('NextAuth is disabled', { status: 503 })
    },
    auth: async () => null,
    signIn: async () => '/login',
    signOut: async () => '/'
  };
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = nextAuthInstance;