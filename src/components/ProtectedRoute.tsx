// src/components/ProtectedRoute.tsx
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function requireAdminSession() {
  const cookiesList = await cookies(); // Await для получения cookies
  const adminSessionCookie = cookiesList.get('admin_session');

  if (!adminSessionCookie) {
    // Нет сессии, перенаправляем на логин
    redirect('/login');
  }

  try {
    const sessionData = JSON.parse(decodeURIComponent(adminSessionCookie.value));

    if (!sessionData.userId || !sessionData.username) {
      // Некорректная сессия, перенаправляем на логин
      redirect('/login');
    }

    // Проверяем время жизни сессии (24 часа)
    const sessionAge = Date.now() - sessionData.timestamp;
    if (sessionAge > 24 * 60 * 60 * 1000) { // 24 часа в миллисекундах
      // Сессия истекла, перенаправляем на логин
      redirect('/login');
    }
  } catch (e) {
    console.error('Ошибка разбора сессии администратора:', e);
    // Ошибка разбора сессии, перенаправляем на логин
    redirect('/login');
  }
}