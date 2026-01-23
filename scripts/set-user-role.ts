import { createClient } from '@supabase/supabase-js';

/**
 * Скрипт для установки роли пользователя в Supabase Auth
 * Используется для назначения администраторских прав пользователям
 */

async function setUserRole(userId: string, role: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Необходимо указать NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY в переменных окружения');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  });

  try {
    // Обновляем метаданные пользователя, добавляя роль
    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        role: role
      }
    });

    if (error) {
      console.error('Ошибка при обновлении роли пользователя:', error.message || error);
      return { success: false, error: error.message || error };
    }

    console.log('Роль пользователя успешно обновлена:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Ошибка при попытке обновить роль пользователя:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// Функция для поиска пользователя по email и установки ему роли
async function setUserRoleByEmail(email: string, role: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Необходимо указать NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY в переменных окружения');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  });

  try {
    // Сначала находим пользователя по email
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('Ошибка при получении списка пользователей:', error.message || error);
      return { success: false, error: error.message || error };
    }

    const user = data.users.find(u => u.email === email);

    if (!user) {
      console.error('Пользователь с указанным email не найден:', email);
      return { success: false, error: 'User not found' };
    }

    // Обновляем роль пользователя
    const updateResult = await setUserRole(user.id, role);
    return updateResult;
  } catch (error) {
    console.error('Ошибка при попытке найти пользователя и обновить роль:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// Командная строка
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Использование:');
    console.log('  Установить роль по ID пользователя: npm run set-user-role -- <userId> <role>');
    console.log('  Установить роль по email: npm run set-user-role-email -- <email> <role>');
    console.log('  Доступные роли: admin, super_admin, user');
    process.exit(1);
  }

  const method = process.env.SET_BY_EMAIL === 'true' ? 'email' : 'id';
  const identifier = args[0];
  const role = args[1];

  if (method === 'email') {
    setUserRoleByEmail(identifier, role)
      .then(result => {
        if (result?.success) {
          console.log('Роль успешно установлена для пользователя с email:', identifier);
        } else {
          console.error('Не удалось установить роль для пользователя с email:', identifier);
        }
        process.exit(result?.success ? 0 : 1);
      });
  } else {
    setUserRole(identifier, role)
      .then(result => {
        if (result?.success) {
          console.log('Роль успешно установлена для пользователя с ID:', identifier);
        } else {
          console.error('Не удалось установить роль для пользователя с ID:', identifier);
        }
        process.exit(result?.success ? 0 : 1);
      });
  }
}

export { setUserRole, setUserRoleByEmail };