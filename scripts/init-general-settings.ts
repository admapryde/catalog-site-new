import { createClient } from '@/lib/supabase-server';

async function initializeGeneralSettings() {
  const supabase = await createClient();

  try {
    // Проверяем, существует ли уже запись в таблице general_settings
    const { data: existingRecord, error: selectError } = await supabase
      .from('general_settings')
      .select('id')
      .limit(1);

    if (selectError && selectError.code !== '42P01') { // 42P01 означает, что таблица не существует
      console.error('Ошибка при проверке существования настроек:', selectError.message || selectError);
      throw selectError;
    }

    // Если таблица существует и в ней нет записей, добавляем начальную запись
    if (existingRecord && existingRecord.length === 0) {
      const { error: insertError } = await supabase
        .from('general_settings')
        .insert([{
          site_title: 'Каталог',
          site_icon: '/favicon.ico',
          site_footer_info: '© 2026 Каталог. Все права защищены.'
        }]);

      if (insertError) {
        console.error('Ошибка при добавлении начальных настроек:', insertError.message || insertError);
        throw insertError;
      }

      console.log('Начальные общие настройки успешно добавлены');
    } else {
      console.log('Общие настройки уже существуют в базе данных');
    }
  } catch (error) {
    if ((error as any).code === '42P01') {
      console.log('Таблица general_settings не существует, возможно, миграция ещё не выполнена');
    } else {
      console.error('Ошибка при инициализации общих настроек:', error);
      throw error;
    }
  }
}

// Запускаем инициализацию
initializeGeneralSettings().catch(console.error);