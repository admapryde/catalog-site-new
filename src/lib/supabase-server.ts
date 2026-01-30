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
          // В целях безопасности и соответствия лучшим практикам Next.js,
          // мы не устанавливаем куки напрямую из серверных компонентов
          if (process.env.NODE_ENV !== 'production') {
            console.warn('Попытка установки куки в серверном компоненте. Используйте Server Action или Route Handler.');
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

  const supabase = createServerClient(
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
        },
      },
    }
  );

  return supabase;
}

// Функция для выполнения запроса к Supabase с обработкой ошибок ограничения частоты
export async function supabaseWithRetry<T>(
  supabaseInstance: any,
  operation: (client: any) => Promise<T>
): Promise<T> {
  return await retryOnRateLimit(async () => {
    return await operation(supabaseInstance);
  });
}

// Функция для повторных попыток при ошибках с ограничением частоты
async function retryOnRateLimit<T>(fn: () => Promise<T>, maxRetries: number = 3): Promise<T> {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Проверяем, является ли ошибка ошибкой ограничения частоты запросов
      if (error?.status === 429 || error?.code === 'over_request_rate_limit') {
        if (i < maxRetries - 1) {
          // Вычисляем задержку с экспоненциальным увеличением (100ms, 200ms, 400ms...)
          const delay = Math.pow(2, i) * 100 + Math.random() * 100; // Добавляем немного рандома
          console.warn(`Ограничение частоты запросов, ждем ${delay}мс перед повторной попыткой ${i + 1}/${maxRetries}`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }

      // Если это другая ошибка или исчерпаны попытки, выбрасываем ошибку
      throw error;
    }
  }

  throw lastError;
}

// Функция для безопасного логирования куки без раскрытия чувствительных данных
function logSecureCookies(cookiesToSet: any[]) {
  if (process.env.NODE_ENV !== 'production') {
    const maskedCookies = cookiesToSet.map(cookie => ({
      name: cookie.name,
      value: cookie.value ? `${cookie.value.substring(0, 10)}...${cookie.value.substring(cookie.value.length - 4)}` : '',
      options: cookie.options
    }));
    console.log('Установка куки в API маршруте (значения замаскированы):', maskedCookies);
  }
}

// Функция для получения клиента Storage
export async function createStorageClient(request?: NextRequest) {
  const supabase = request ? await createAPIClient(request) : await createClient();
  return supabase.storage;
}