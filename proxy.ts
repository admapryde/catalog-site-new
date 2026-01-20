import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function proxy(request: NextRequest) {
  console.log('Proxy executed for:', request.url);

  const { pathname } = new URL(request.url);

  // Защита маршрутов админ-панели
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    console.log('Accessing admin route:', pathname);

    // Создаем Supabase клиент для proxy
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            // Получаем все куки, фильтруя только те, что принадлежат Supabase
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
        },
      }
    );

    // Получаем информацию о пользователе (более безопасный способ)
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      console.log('No valid user, redirecting to login');
      console.log('User error:', error);
      const url = new URL('/login', request.url);
      return NextResponse.redirect(url);
    }

    // Проверяем, что пользователь является администратором
    const userRole = user.user_metadata?.role || 'user';
    console.log('User role from metadata:', userRole);
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      console.log('User is not an admin, redirecting to login');
      const url = new URL('/login', request.url);
      return NextResponse.redirect(url);
    }

    console.log('Valid admin session found, user role:', userRole);
    // Возвращаем NextResponse.next() без изменений, чтобы продолжить обработку запроса
    return NextResponse.next();
  }

  return NextResponse.next();
}

// Указываем маршруты, которые требуют аутентификации
export const config = {
  matcher: [
    /*
     * Защищаем все маршруты, начинающиеся с /admin
     */
    '/admin((?!/login).*)',
  ],
}