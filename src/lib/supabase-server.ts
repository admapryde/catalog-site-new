import { cookies, headers } from 'next/headers'
import { NextRequest } from 'next/server'

// Функция для использования в серверных компонентах
export async function createClient() {
  // Используем реальный Supabase клиент
  const { createServerClient } = await import('@supabase/ssr');

  // Проверяем, что URL действительно является валидным URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  try {
    new URL(supabaseUrl);
  } catch (e) {
    console.error('Неверный формат Supabase URL:', supabaseUrl);
    throw new Error('Неверный формат Supabase URL');
  }

  // В Next.js App Router cookies() возвращает асинхронный объект
  // Поэтому мы оборачиваем вызовы в async/await и используем React.use() внутри серверного компонента
  return createServerClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: async () => {
          // Используем cookies() напрямую для получения куки в RSC
          const cookieStore = await cookies();

          // Получаем все куки по отдельности
          const supabaseCookieNames = [
            'sb-access-token',
            'sb-refresh-token',
            'sb-provider-token',
            'sb-invite-token',
            'sb-email-confirmation-token',
            'sb-phone-confirmation-token'
          ];

          const allCookies = [];
          for (const name of supabaseCookieNames) {
            const cookie = cookieStore.get(name);
            if (cookie) {
              allCookies.push({
                name: cookie.name,
                value: cookie.value,
                options: {}
              });
            }
          }

          return allCookies;
        },
        setAll: async (cookiesToSet) => {
          // Для установки куки используем асинхронный подход
          try {
            const cookieStore = await cookies();
            for (const { name, value, options } of cookiesToSet) {
              await cookieStore.set(name, value, options);
            }
          } catch (error) {
            console.error('Ошибка при установке куки:', error);
          }
        },
      },
    }
  );
}

// Функция для использования в API маршрутах
export async function createAPIClient(request: NextRequest) {
  // Используем реальный Supabase клиент
  const { createServerClient } = await import('@supabase/ssr');

  // Проверяем, что URL действительно является валидным URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  try {
    new URL(supabaseUrl);
  } catch (e) {
    console.error('Неверный формат Supabase URL:', supabaseUrl);
    throw new Error('Неверный формат Supabase URL');
  }

  return createServerClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => {
          // В API маршрутах используем request.cookies вместо cookies() из next/headers
          const allCookies = [];

          // Получаем все куки по отдельности
          const supabaseCookieNames = [
            'sb-access-token',
            'sb-refresh-token',
            'sb-provider-token',
            'sb-invite-token',
            'sb-email-confirmation-token',
            'sb-phone-confirmation-token'
          ];

          for (const name of supabaseCookieNames) {
            // Получаем куки из объекта request
            const cookie = request.cookies.get(name);
            if (cookie) {
              allCookies.push({ name, value: cookie.value, options: {} });
            }
          }

          return allCookies;
        },
        setAll: (cookiesToSet) => {
          // В API маршрутах мы не можем напрямую устанавливать куки через request
          // Куки будут установлены в ответе
          console.log('Установка куки в API маршруте:', cookiesToSet);
        },
      },
    }
  );
}

// Функция для получения клиента Storage
export async function createStorageClient(request?: NextRequest) {
  const supabase = request ? await createAPIClient(request) : await createClient();
  return supabase.storage;
}