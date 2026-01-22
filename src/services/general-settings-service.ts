import { createClient } from '@/lib/supabase-server';

// Define type for general settings
export interface GeneralSettings {
  id: string;
  site_title: string;
  site_icon: string;
  site_footer_info: string;
  created_at: string;
  updated_at: string;
}

// Глобальный объект для доступа к кэшу из разных частей приложения
declare global {
  var generalSettingsCache: Map<string, { data: any; timestamp: number }> | undefined;
}

// Используем глобальный кэш для обеспечения согласованности между запросами
if (!global.generalSettingsCache) {
  global.generalSettingsCache = new Map();
}

// Кэшируем результаты запросов на 5 минут
const CACHE_DURATION = 5 * 60 * 1000; // 5 минут в миллисекундах

export async function getGeneralSettings(): Promise<GeneralSettings> {
  const cacheKey = 'general_settings';
  const cached = global.generalSettingsCache!.get(cacheKey);

  // Проверяем, есть ли свежие данные в кэше
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as GeneralSettings;
  }

  const supabase = await createClient();

  try {
    // Получаем общие настройки сайта
    const { data, error } = await supabase
      .from('general_settings')
      .select('*')
      .limit(1);  // Берем только первую запись

    if (error) {
      // Проверяем, является ли ошибка связанной с отсутствием таблицы
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('Таблица general_settings не существует, возвращаем значения по умолчанию');
        const defaultData = {
          id: '',
          site_title: 'Каталог',
          site_icon: '/favicon.ico',
          site_footer_info: '© 2026 Каталог. Все права защищены.',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Сохраняем в кэш на случай, если ошибка постоянная
        global.generalSettingsCache!.set(cacheKey, { data: defaultData, timestamp: Date.now() });
        return defaultData;
      }

      console.error('Ошибка получения общих настроек:', error.message || error);
      // Возвращаем значения по умолчанию
      const defaultData = {
        id: '',
        site_title: 'Каталог',
        site_icon: '/favicon.ico',
        site_footer_info: '© 2026 Каталог. Все права защищены.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Сохраняем в кэш на случай, если ошибка постоянная
      global.generalSettingsCache!.set(cacheKey, { data: defaultData, timestamp: Date.now() });
      return defaultData;
    }

    if (!data || data.length === 0) {
      // Если нет ни одной записи, возвращаем значения по умолчанию
      const defaultData = {
        id: '',
        site_title: 'Каталог',
        site_icon: '/favicon.ico',
        site_footer_info: '© 2026 Каталог. Все права защищены.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Сохраняем в кэш
      global.generalSettingsCache!.set(cacheKey, { data: defaultData, timestamp: Date.now() });
      return defaultData;
    }

    // Возвращаем полученные настройки, заполняя недостающие значения по умолчанию
    const settings = data[0];
    const finalResult = {
      id: settings.id || '',
      site_title: settings.site_title || 'Каталог',
      site_icon: settings.site_icon || '/favicon.ico',
      site_footer_info: settings.site_footer_info || '© 2026 Каталог. Все права защищены.',
      created_at: settings.created_at || new Date().toISOString(),
      updated_at: settings.updated_at || new Date().toISOString()
    };

    // Сохраняем результат в кэш
    global.generalSettingsCache!.set(cacheKey, { data: finalResult, timestamp: Date.now() });

    return finalResult;
  } catch (error: any) {
    // Проверяем, является ли ошибка связанной с отсутствием таблицы
    if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
      console.warn('Таблица general_settings не существует, возвращаем значения по умолчанию');
      const defaultData = {
        id: '',
        site_title: 'Каталог',
        site_icon: '/favicon.ico',
        site_footer_info: '© 2026 Каталог. Все права защищены.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Сохраняем в кэш на случай, если ошибка постоянная
      global.generalSettingsCache!.set(cacheKey, { data: defaultData, timestamp: Date.now() });
      return defaultData;
    }

    console.error('Ошибка получения общих настроек:', error);
    // Возвращаем значения по умолчанию в случае любой ошибки
    const defaultData = {
      id: '',
      site_title: 'Каталог',
      site_icon: '/favicon.ico',
      site_footer_info: '© 2026 Каталог. Все права защищены.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Сохраняем в кэш на случай, если ошибка постоянная
    global.generalSettingsCache!.set(cacheKey, { data: defaultData, timestamp: Date.now() });
    return defaultData;
  }
}

// Функция для инициализации настроек, если их нет
export async function initializeGeneralSettingsIfNeeded(): Promise<boolean> {
  const supabase = await createClient();

  try {
    // Проверяем, существует ли уже запись в таблице general_settings
    const { data: existingRecord, error: selectError } = await supabase
      .from('general_settings')
      .select('id')
      .limit(1);

    if (selectError && selectError.code !== '42P01') { // 42P01 означает, что таблица не существует
      console.error('Ошибка при проверке существования настроек:', selectError.message || selectError);
      return false;
    }

    // Если таблица существует и в ней нет записей, добавляем начальную запись
    if (existingRecord && existingRecord.length === 0) {
      const { error: insertError } = await supabase
        .from('general_settings')
        .insert([{
          site_title: 'Каталог',
          site_icon: '/favicon.ico',
          site_footer_info: '© 2026 Каталог. Все права защищены.',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (insertError) {
        console.error('Ошибка при добавлении начальных настроек:', insertError.message || insertError);
        return false;
      }

      // Инвалидируем кэш после успешного создания начальных настроек
      if (global.generalSettingsCache) {
        global.generalSettingsCache.delete('general_settings');
      }

      console.log('Начальные общие настройки успешно добавлены');
      return true;
    } else {
      console.log('Общие настройки уже существуют в базе данных');
      return true;
    }
  } catch (error: any) {
    if (error.code === '42P01') {
      console.log('Таблица general_settings не существует, возможно, миграция ещё не выполнена');
      return false;
    } else {
      console.error('Ошибка при инициализации общих настроек:', error);
      return false;
    }
  }
}

export async function updateGeneralSettings(settings: Partial<GeneralSettings>): Promise<boolean> {
  const supabase = await createClient();

  try {
    // Сначала получаем существующую запись, чтобы получить её ID
    const { data: existingData, error: selectError } = await supabase
      .from('general_settings')
      .select('id')
      .limit(1);

    if (selectError) {
      // Проверяем, является ли ошибка связанной с отсутствием таблицы
      if (selectError.code === '42P01' || selectError.message?.includes('does not exist')) {
        console.warn('Таблица general_settings не существует, невозможно обновить настройки');
        return false;
      }

      console.error('Ошибка получения ID настроек:', selectError.message || selectError);
      return false;
    }

    if (!existingData || existingData.length === 0) {
      // Если запись не существует, создаем новую
      const { error: insertError } = await supabase
        .from('general_settings')
        .insert([{
          site_title: settings.site_title,
          site_icon: settings.site_icon,
          site_footer_info: settings.site_footer_info,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (insertError) {
        console.error('Ошибка создания настроек:', insertError.message || insertError);
        return false;
      }

      // Инвалидируем кэш после успешного создания
      if (global.generalSettingsCache) {
        global.generalSettingsCache.delete('general_settings');
      }

      return true;
    }

    // Обновляем общие настройки сайта по ID
    const { error } = await supabase
      .from('general_settings')
      .update({
        site_title: settings.site_title,
        site_icon: settings.site_icon,
        site_footer_info: settings.site_footer_info,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingData[0].id); // Используем ID для обновления конкретной записи

    if (error) {
      // Проверяем, является ли ошибка связанной с отсутствием таблицы
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.error('Таблица general_settings не существует, невозможно обновить настройки');
        return false;
      }

      console.error('Ошибка обновления общих настроек:', error.message || error);
      return false;
    }

    // Инвалидируем кэш после успешного обновления
    if (global.generalSettingsCache) {
      global.generalSettingsCache.delete('general_settings');
    }

    return true;
  } catch (error: any) {
    // Проверяем, является ли ошибка связанной с отсутствием таблицы
    if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
      console.error('Таблица general_settings не существует, невозможно обновить настройки');
      return false;
    }

    console.error('Ошибка обновления общих настроек:', error);
    return false;
  }
}