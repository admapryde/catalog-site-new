import { createSupabaseBrowserClient } from '@/lib/supabase-browser-client';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  [key: string]: any; // Для дополнительных полей
}

/**
 * Аутентифицирует пользователя через Supabase Auth
 * @param email Email пользователя
 * @param password Пароль пользователя
 * @returns Объект пользователя если аутентификация успешна, null если нет
 */
export async function signInWithPassword(email: string, password: string): Promise<AuthUser | null> {
  console.log('Попытка аутентификации через Supabase Auth:', email);

  const supabase = createSupabaseBrowserClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Ошибка при аутентификации через Supabase:', error);
    return null;
  }

  if (!data.user) {
    console.log('Пользователь не найден');
    return null;
  }

  console.log('Аутентификация через Supabase успешна');

  return {
    id: data.user.id,
    email: data.user.email || '',
    role: data.user.user_metadata?.role || 'user',
  };
}

/**
 * Проверяет, авторизован ли пользователь через Supabase Auth
 * @returns Объект пользователя если авторизован, null если нет
 */
export async function getSupabaseSession(): Promise<AuthUser | null> {
  const supabase = createSupabaseBrowserClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error('Ошибка при получении сессии:', error);
    return null;
  }

  if (!session) {
    return null;
  }

  // Пропускаем проверку времени жизни сессии в серверном компоненте
  // Время жизни сессии проверяется в middleware/proxy

  return {
    id: session.user.id,
    email: session.user.email || '',
    role: session.user.user_metadata?.role || 'user',
  };
}

/**
 * Проверяет, авторизован ли пользователь, и перенаправляет на страницу входа, если нет
 * @returns Объект пользователя
 */
export async function requireSupabaseSession(): Promise<AuthUser> {
  const user = await getSupabaseSession();

  if (!user) {
    redirect('/login');
  }

  return user;
}

/**
 * Выходит из системы и удаляет сессию
 */
export async function signOut(): Promise<void> {
  const supabase = createSupabaseBrowserClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Ошибка при выходе из системы:', error);
  }

  // Удаляем куки сессии администратора
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
}