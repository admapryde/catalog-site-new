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

          // В Next.js App Router объект cookies имеет метод getAll(),
          // но он возвращает объекты с полями name и value
          const allCookies = cookieStore.getAll();
          const supabaseCookies = allCookies.filter(cookie =>
            cookie.name.startsWith('sb-')
          );

          return supabaseCookies;
        },
        setAll: async (cookiesToSet) => {
          // В Next.js App Router куки можно устанавливать только в Server Actions или Route Handlers
          // В серверных компонентах можно только читать куки
          // Поэтому просто выводим предупреждение об этом
          console.warn('Попытка установки куки в серверном компоненте. Используйте Server Action или Route Handler.');
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
        getAll() {
          // В API маршрутах используем request.cookies вместо cookies() из next/headers
          const allCookies = [];

          // Получаем все куки из запроса, фильтруя только те, что принадлежат Supabase
          const cookieHeader = request.headers.get('Cookie');
          if (cookieHeader) {
            const cookiesArray = cookieHeader.split('; ');
            for (const cookieString of cookiesArray) {
              const [name, value] = cookieString.split('=');
              if (name && value && name.startsWith('sb-')) {
                allCookies.push({ name, value, options: {} });
              }
            }
          }

          return allCookies;
        },
        setAll(cookiesToSet) {
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