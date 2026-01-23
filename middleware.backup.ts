import { NextRequest, NextResponse } from 'next/server';
import { createClient } from './src/lib/supabase-server';

export async function middleware(request: NextRequest) {
  // Проверяем, является ли маршрут частью админ-панели
  if (request.nextUrl.pathname.startsWith('/admin')) {
    try {
      const supabase = await createClient();
      
      // Получаем сессию пользователя из Supabase
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session) {
        // Если нет сессии или произошла ошибка, перенаправляем на страницу входа
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.search = `error=unauthorized&r=${encodeURIComponent(request.nextUrl.pathname)}`;
        return NextResponse.redirect(url);
      }

      // Проверяем, что пользователь является администратором
      const userRole = session.user.user_metadata?.role || 'user';
      if (userRole !== 'admin' && userRole !== 'super_admin') {
        // Если пользователь не администратор, перенаправляем на страницу входа
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.search = `error=forbidden&r=${encodeURIComponent(request.nextUrl.pathname)}`;
        return NextResponse.redirect(url);
      }

      // Пользователь авторизован как администратор, продолжаем обработку запроса
      return NextResponse.next();
    } catch (error) {
      console.error('Ошибка в middleware:', error);
      // В случае ошибки перенаправляем на страницу входа
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.search = `error=session_error&r=${encodeURIComponent(request.nextUrl.pathname)}`;
      return NextResponse.redirect(url);
    }
  }

  // Для всех других маршрутов продолжаем обработку без проверки
  return NextResponse.next();
}

// Указываем маршруты, которые должны проходить через middleware
export const config = {
  matcher: [
    /*
     * Обрабатываем все маршруты, начинающиеся с /admin
     * Исключаем /admin/login, чтобы можно было получить доступ к странице входа
     */
    '/admin((?!/login|/_next/static|/_next/image|/favicon.ico).*)',
  ],
};