import { createClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export interface AdminUser {
  id: string;
  username: string;
  email?: string;
  role: string;
}

/**
 * Проверяет, авторизован ли администратор
 * @returns Объект пользователя если авторизован, null если нет
 */
export async function getAdminSession(): Promise<AdminUser | null> {
  const cookieStore = await cookies();
  const adminSessionCookie = cookieStore.get('admin_session');

  if (!adminSessionCookie) {
    return null;
  }

  try {
    const sessionData = JSON.parse(decodeURIComponent(adminSessionCookie.value));
    
    if (!sessionData.userId || !sessionData.username) {
      return null;
    }

    // Проверяем время жизни сессии (24 часа)
    const sessionAge = Date.now() - sessionData.timestamp;
    if (sessionAge > 24 * 60 * 60 * 1000) { // 24 часа в миллисекундах
      return null;
    }

    return {
      id: sessionData.userId,
      username: sessionData.username,
      role: sessionData.role
    };
  } catch (e) {
    console.error('Ошибка разбора сессии администратора:', e);
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
  const cookieStore = await cookies();
  
  cookieStore.set('admin_session', JSON.stringify({
    userId: userData.id,
    username: userData.username,
    role: userData.role,
    timestamp: Date.now()
  }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60, // 24 часа
    path: '/',
    sameSite: 'strict',
  });
}

/**
 * Уничтожает сессию администратора
 */
export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
}

/**
 * Аутентифицирует администратора по логину и паролю
 * @param username Логин
 * @param password Пароль
 * @returns Объект пользователя если аутентификация успешна, null если нет
 */
export async function authenticateAdmin(username: string, password: string): Promise<AdminUser | null> {
  console.log('Попытка аутентификации пользователя:', username);

  const supabase = await createClient();

  // Получаем пользователя из базы данных
  const { data: user, error } = await supabase
    .from('admin_users')
    .select('id, username, email, password_hash, role')
    .eq('username', username)
    .single();

  console.log('Результат запроса к admin_users:', { user, error });

  if (error) {
    console.error('Ошибка при запросе к admin_users:', error);
    return null;
  }

  if (!user) {
    console.log('Пользователь не найден');
    return null;
  }

  // Импортируем bcrypt для проверки пароля
  const bcrypt = await import('bcryptjs');
  const isValidPassword = await bcrypt.default.compare(password, user.password_hash);

  console.log('Результат проверки пароля:', isValidPassword);

  if (!isValidPassword) {
    return null;
  }

  console.log('Аутентификация успешна');

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role
  };
}