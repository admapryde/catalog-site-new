import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Создает Supabase клиент с использованием токена сессии пользователя
 * Это позволяет выполнять операции от имени аутентифицированного пользователя
 */
export async function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Отсутствуют переменные окружения для Supabase');
  }

  // Получаем сессионный токен из кук
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('sb-access-token')?.value;
  const refreshToken = cookieStore.get('sb-refresh-token')?.value;

  // Создаем клиент с анонимным ключом
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Если у нас есть токен доступа, устанавливаем сессию
  if (accessToken) {
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || ''
    });
  }

  return supabase;
}