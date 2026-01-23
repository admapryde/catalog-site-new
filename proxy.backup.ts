import { NextRequest, NextResponse } from 'next/server';

// Просто пропускаем запросы дальше, проверка авторизации будет в NextAuth
export async function proxy(request: NextRequest) {
  console.log('Proxy executed for:', request.url);

  const { pathname } = new URL(request.url);

  // Просто логируем доступ к админ-панели, не делаем никаких проверок
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    console.log('Accessing admin route:', pathname);
  }

  return NextResponse.next();
}

// Указываем маршруты, которые требуют аутентификации
export const config = {
  matcher: [
    /*
     * Обрабатываем все маршруты, начинающиеся с /admin
     */
    '/admin((?!/login).*)',
  ],
}