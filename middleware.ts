export default function middleware(request: Request) {
  // Простая проверка для всех маршрутов
  console.log('Middleware executed for:', request.url);

  const { pathname } = new URL(request.url);

  // Защита маршрутов админ-панели
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    console.log('Accessing admin route:', pathname);

    // Проверяем наличие сессии администратора
    const cookieHeader = request.headers.get('cookie');
    console.log('Cookie header:', cookieHeader); // Добавим логирование куки

    let hasValidSession = false;

    if (cookieHeader) {
      const cookies = cookieHeader.split(';');
      console.log('Parsed cookies:', cookies); // Логируем распарсенные куки

      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        console.log('Checking cookie:', name); // Логируем проверяемое имя куки

        if (name === 'admin_session') {
          console.log('Found admin_session cookie, value length:', value?.length || 0); // Логируем длину значения

          try {
            const sessionData = JSON.parse(decodeURIComponent(value));
            console.log('Parsed session data:', sessionData); // Логируем распарсенную сессию

            if (sessionData.userId && sessionData.username) {
              const sessionAge = Date.now() - sessionData.timestamp;
              // Проверяем, что сессия не старше 24 часов
              if (sessionAge < 24 * 60 * 60 * 1000) {
                hasValidSession = true;
                console.log('Valid admin session found');
              } else {
                console.log('Session expired');
              }
            }
          } catch (e) {
            console.log('Invalid session format', e);
          }
          break;
        }
      }
    }

    if (!hasValidSession) {
      console.log('No valid session, redirecting to login');
      const url = new URL('/login', request.url);
      return Response.redirect(url);
    }
  }

  return null;
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