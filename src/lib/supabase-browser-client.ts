import { createBrowserClient } from '@supabase/ssr';

// Конфигурация клиента Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Создаем клиентский экземпляр Supabase
export const createSupabaseBrowserClient = () => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Отсутствуют переменные окружения для Supabase');
  }

  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        const cookies = document.cookie.split('; ');
        return cookies
          .map(cookie => {
            const [name, value] = cookie.split('=');
            return { name, value };
          })
          .filter(cookie => cookie.name.startsWith('sb-'));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          let cookieString = `${name}=${value}`;

          if (options) {
            if (options.maxAge) cookieString += `; max-age=${options.maxAge}`;
            if (options.domain) cookieString += `; domain=${options.domain}`;
            if (options.path) cookieString += `; path=${options.path}`;
            if (options.sameSite) cookieString += `; samesite=${options.sameSite}`;
            if (options.secure) cookieString += '; secure';
          }

          document.cookie = cookieString;
        });
      },
    },
  });
};