import { createClient, createAPIClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';
import { retryOnRateLimit } from '@/lib/retry-utils';

export interface AdminUser {
  id: string;
  email: string;
  role: string;
}

/**
 * Проверяет, авторизован ли администратор через Supabase Auth
 * @returns Объект пользователя если авторизован, null если нет
 */
export async function getAdminSession(): Promise<AdminUser | null> {
  const supabase = await createClient();

  try {
    const result = await retryOnRateLimit(async () => {
      return await supabase.auth.getUser();
    });

    const {
      data: { user },
      error,
    } = result;

    if (error) {
      console.error('Ошибка при получении пользователя:', error);
      return null;
    }

    if (!user) {
      return null;
    }

    // Проверяем, что пользователь является администратором
    const userRole = user.user_metadata?.role || 'user';
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      return null;
    }

    // Пропускаем проверку времени жизни сессии в серверном компоненте
    // Время жизни сессии проверяется в middleware/proxy

    return {
      id: user.id,
      email: user.email || '',
      role: userRole
    };
  } catch (error) {
    console.error('Ошибка при получении пользователя:', error);
    return null;
  }
}

/**
 * Проверяет, авторизован ли администратор через Supabase Auth в API маршрутах
 * @param request Объект запроса Next.js
 * @returns Объект пользователя если авторизован, null если нет
 */
export async function getAdminSessionFromRequest(request: NextRequest): Promise<AdminUser | null> {
  const supabase = await createAPIClient(request);

  try {
    const result = await retryOnRateLimit(async () => {
      return await supabase.auth.getUser();
    });

    const {
      data: { user },
      error,
    } = result;

    if (error) {
      console.error('Ошибка при получении пользователя из запроса:', error);
      return null;
    }

    if (!user) {
      return null;
    }

    // Проверяем, что пользователь является администратором
    const userRole = user.user_metadata?.role || 'user';
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      return null;
    }

    // Пропускаем проверку времени жизни сессии в серверном компоненте
    // Время жизни сессии проверяется в middleware/proxy

    return {
      id: user.id,
      email: user.email || '',
      role: userRole
    };
  } catch (error) {
    console.error('Ошибка при получении пользователя из запроса:', error);
    return null;
  }
}

/**
 * Проверяет, авторизован ли администратор, и перенаправляет на страницу входа, если нет
 * @returns Объект пользователя
 */
export async function requireAdminSession(): Promise<AdminUser> {
  const user = await getAdminSession();

  if (!user) {
    redirect('/login');
  }

  return user;
}

/**
 * Создает сессию администратора
 * @param userData Данные пользователя
 * @returns ID сессии
 */
export async function createAdminSession(userData: AdminUser): Promise<void> {
  // Сессия создается автоматически через Supabase Auth,
  // нам не нужно ничего дополнительно сохранять в куки
}

/**
 * Уничтожает сессию администратора
 */
export async function destroyAdminSession(): Promise<void> {
  const supabase = await createClient();

  try {
    await retryOnRateLimit(async () => {
      return await supabase.auth.signOut();
    });
  } catch (error) {
    console.error('Ошибка при выходе из системы:', error);
  }

  // Удаляем куки сессии администратора
  try {
    const cookieStore = await cookies();
    cookieStore.delete('admin_session');
  } catch (e) {
    console.warn('Не удалось удалить куки сессии администратора:', e);
  }
}

/**
 * Аутентифицирует администратора через Supabase Auth
 * @param email Email
 * @param password Пароль
 * @returns Объект пользователя если аутентификация успешна, null если нет
 */
export async function authenticateAdmin(email: string, password: string): Promise<AdminUser | null> {
  console.log('Попытка аутентификации пользователя:', email);

  const supabase = await createClient();

  try {
    const result = await retryOnRateLimit(async () => {
      return await supabase.auth.signInWithPassword({
        email,
        password,
      });
    });

    const { data, error } = result;

    if (error) {
      console.error('Ошибка при аутентификации через Supabase:', error);
      return null;
    }

    if (!data.session) {
      console.log('Сессия не создана');
      return null;
    }

    // После успешного входа получаем информацию о пользователе через более безопасный метод
    const userResult = await retryOnRateLimit(async () => {
      return await supabase.auth.getUser();
    });

    const { data: userData, error: userError } = userResult;

    if (userError || !userData.user) {
      console.error('Ошибка при получении информации о пользователе после входа:', userError);
      return null;
    }

    // Проверяем, что пользователь является администратором
    const userRole = userData.user.user_metadata?.role || 'user';
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      console.log('Пользователь не является администратором');
      return null;
    }

    console.log('Аутентификация успешна');

    return {
      id: userData.user.id,
      email: userData.user.email || '',
      role: userRole
    };
  } catch (error) {
    console.error('Ошибка при аутентификации через Supabase:', error);
    return null;
  }
}