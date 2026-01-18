// Тестирование конфигурации Supabase
import { createClient } from '@/lib/supabase-server';

async function testSupabaseConfig() {
  console.log('Проверка конфигурации Supabase...');
  
  const supabase = await createClient();
  
  // Проверим, является ли это мок-клиентом (у него будет определенные отличительные черты)
  if ((supabase as any).__is_mock_client) {
    console.log('❌ Используется мок-версия клиента Supabase');
  } else {
    console.log('✅ Используется реальный клиент Supabase');
    
    // Попробуем выполнить простой запрос к таблице admin_users
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id, username')
        .limit(1);
        
      if (error) {
        console.error('❌ Ошибка при запросе к admin_users:', error);
      } else {
        console.log('✅ Запрос к admin_users успешен:', data);
      }
    } catch (err) {
      console.error('❌ Исключение при запросе к admin_users:', err);
    }
  }
}

// Вызовем тестовую функцию
testSupabaseConfig();