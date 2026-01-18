'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { authenticateAdmin, type AdminUser } from '@/services/admin-auth-service';

export async function adminLogin(formData: FormData, shouldRedirect: boolean = true): Promise<{ error?: string }> {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  const user = await authenticateAdmin(username, password);

  if (!user) {
    return { error: 'Неверные учетные данные' };
  }

  // Устанавливаем сессию администратора на сервере
  const cookieStore = await cookies(); // Добавлен await
  cookieStore.set('admin_session', JSON.stringify({
    userId: user.id,
    username: user.username,
    role: user.role,
    timestamp: Date.now()
  }), {
    httpOnly: false, // Изменили на false, чтобы куки было доступно для проверки
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60, // 24 часа
    path: '/',
    sameSite: 'lax', // Изменили на lax для лучшей совместимости
  });

  // Выполняем редирект на сервере, если это необходимо
  if (shouldRedirect) {
    redirect('/admin');
  }

  return {}; // Возвращаем пустой объект при успехе, если не делаем редирект
}