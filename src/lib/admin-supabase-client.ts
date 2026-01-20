import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getAdminSession } from '@/services/admin-auth-service';

/**
 * Создает Supabase клиент с использованием токена сессии администратора
 * Это позволяет выполнять операции от имени аутентифицированного администратора
 */
export async function createAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Отсутствуют переменные окружения для Supabase');
  }

  // Проверяем, что пользователь аутентифицирован как администратор
  const adminUser = await getAdminSession();
  if (!adminUser) {
    throw new Error('Требуется аутентификация администратора');
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Получаем сессию из кук
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('sb-access-token')?.value;

  // Если у нас есть токен доступа, устанавливаем сессию
  if (accessToken) {
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: cookieStore.get('sb-refresh-token')?.value || ''
    });
  }

  return supabase;
}