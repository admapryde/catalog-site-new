'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { authenticateAdmin, type AdminUser } from '@/services/admin-auth-service';

export async function adminLogin(formData: FormData, shouldRedirect: boolean = true): Promise<{ error?: string }> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const user = await authenticateAdmin(email, password);

  if (!user) {
    return { error: 'Неверные учетные данные' };
  }

  // Сессия управляется через Supabase Auth, нам не нужно устанавливать куки вручную

  // Выполняем редирект на сервере, если это необходимо
  if (shouldRedirect) {
    redirect('/admin');
  }

  return {}; // Возвращаем пустой объект при успехе, если не делаем редирект
}