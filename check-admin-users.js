// Скрипт для проверки наличия таблицы admin_users и пользователей в ней
import * as fs from 'fs';
import dotenv from 'dotenv';

// Загружаем переменные окружения из .env.local
if (fs.existsSync('./.env.local')) {
  dotenv.config({ path: './.env.local' });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Не найдены учетные данные Supabase в .env.local');
  process.exit(1);
}

const { createClient } = await import('@supabase/supabase-js');
const supabase = createClient(supabaseUrl, supabaseAnonKey);

try {
  console.log('Проверка наличия таблицы admin_users...\n');

  // Попробуем получить пользователей из таблицы admin_users
  const { data: adminUsers, error: adminUsersError } = await supabase
    .from('admin_users')
    .select('*');

  if (adminUsersError) {
    console.error('❌ Ошибка при запросе к таблице admin_users:');
    console.error('Код ошибки:', adminUsersError.code);
    console.error('Сообщение:', adminUsersError.message);
    
    if (adminUsersError.code === '42P01') {
      console.log('\n💡 Таблица admin_users не существует в вашей базе данных Supabase.');
      console.log('👉 Вам нужно создать таблицу согласно инструкции в README.md или SUPABASE_ADMIN_AUTH_SETUP.md');
    }
  } else {
    console.log('✅ Таблица admin_users найдена');
    console.log(`Количество администраторов: ${adminUsers.length}`);
    
    if (adminUsers.length > 0) {
      console.log('\nСписок администраторов:');
      adminUsers.forEach((user, index) => {
        console.log(`${index + 1}. Username: ${user.username}, Email: ${user.email}, Role: ${user.role}`);
      });
    } else {
      console.log('\n⚠️  В таблице admin_users нет ни одного пользователя.');
      console.log('👉 Вам нужно добавить хотя бы одного администратора в таблицу.');
    }
  }

  // Также проверим структуру таблицы, если она существует
  if (!adminUsersError && adminUsers) {
    console.log('\nСтруктура первого пользователя (для примера):');
    if (adminUsers.length > 0) {
      console.log(JSON.stringify(adminUsers[0], null, 2));
    }
  }
} catch (error) {
  console.error('❌ Ошибка при работе с Supabase:', error);
}