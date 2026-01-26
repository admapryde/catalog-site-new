import { createAPIClient, supabaseWithRetry } from '@/lib/supabase-server';
import { NextRequest } from 'next/server';

// Глобальный объект для доступа к кэшу из разных частей приложения
declare global {
  var generalSettingsCache: Map<string, { data: any; timestamp: number }> | undefined;
}

// Кэшируем результаты запросов на 5 минут
const CACHE_DURATION = 5 * 60 * 1000; // 5 минут в миллисекундах

// Используем глобальный кэш для обеспечения согласованности между запросами
if (!global.generalSettingsCache) {
  global.generalSettingsCache = new Map();
}

export interface GeneralSettings {
  id: string;
  site_title: string;
  site_icon: string;
  site_footer_info: string;
  bg_image?: string; // Новое поле для фонового изображения
  created_at: string;
  updated_at: string;
}

export async function GET(request: NextRequest) {
  const cacheKey = 'general_settings';
  const cached = global.generalSettingsCache!.get(cacheKey);

  // Проверяем, есть ли свежие данные в кэше
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    const response = Response.json(cached.data);
    response.headers.set('Cache-Control', 'public, max-age=300'); // 5 минут кэширования
    return response;
  }

  const supabase = await createAPIClient(request);

  try {
    // Получаем общие настройки сайта
    const result = await supabaseWithRetry(supabase, (client) =>
      client
        .from('general_settings')
        .select('*')
        .limit(1)  // Берем только первую запись
    ) as { data: any; error: any };

    const { data, error } = result;

    if (error) {
      // Проверяем, является ли ошибка связанной с отсутствием таблицы
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('Таблица general_settings не существует, возвращаем значения по умолчанию');
        const defaultData = {
          id: '',
          site_title: 'Каталог',
          site_icon: '/favicon.png',
          site_footer_info: '© 2026 Каталог. Все права защищены.',
          bg_image: '', // Добавляем новое поле
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        global.generalSettingsCache!.set(cacheKey, { data: defaultData, timestamp: Date.now() });
        const response = Response.json(defaultData);
        response.headers.set('Cache-Control', 'public, max-age=300'); // 5 минут кэширования
        return response;
      }

      console.error('Ошибка получения общих настроек:', error.message || error);
      // Возвращаем значения по умолчанию
      const defaultResponse = Response.json({
        id: '',
        site_title: 'Каталог',
        site_icon: '/favicon.ico',
        site_footer_info: '© 2026 Каталог. Все права защищены.',
        bg_image: '', // Добавляем новое поле
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Добавляем заголовки для кэширования даже в случае ошибки
      defaultResponse.headers.set('Cache-Control', 'public, max-age=300');
      return defaultResponse;
    }

    if (!data || data.length === 0) {
      // Если нет ни одной записи, возвращаем значения по умолчанию
      const defaultData = {
        id: '',
        site_title: 'Каталог',
        site_icon: '/favicon.ico',
        site_footer_info: '© 2026 Каталог. Все права защищены.',
        bg_image: '', // Добавляем новое поле
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      global.generalSettingsCache!.set(cacheKey, { data: defaultData, timestamp: Date.now() });
      const response = Response.json(defaultData);
      response.headers.set('Cache-Control', 'public, max-age=300'); // 5 минут кэширования
      return response;
    }

    // Возвращаем полученные настройки, заполняя недостающие значения по умолчанию
    const settings = data[0];
    const finalResult = {
      id: settings.id || '',
      site_title: settings.site_title || 'Каталог',
      site_icon: settings.site_icon || '/favicon.ico',
      site_footer_info: settings.site_footer_info || '© 2026 Каталог. Все права защищены.',
      bg_image: settings.bg_image !== undefined ? settings.bg_image : '', // Добавляем новое поле
      created_at: settings.created_at || new Date().toISOString(),
      updated_at: settings.updated_at || new Date().toISOString()
    };

    // Сохраняем результат в кэш
    global.generalSettingsCache!.set(cacheKey, { data: finalResult, timestamp: Date.now() });

    const response = Response.json(finalResult);
    response.headers.set('Cache-Control', 'public, max-age=300'); // 5 минут кэширования
    return response;
  } catch (error: any) {
    // Проверяем, является ли ошибка связанной с отсутствием таблицы
    if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
      console.warn('Таблица general_settings не существует, возвращаем значения по умолчанию');
      const defaultData = {
        id: '',
        site_title: 'Каталог',
        site_icon: '/favicon.ico',
        site_footer_info: '© 2026 Каталог. Все права защищены.',
        bg_image: '', // Добавляем новое поле
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      global.generalSettingsCache!.set(cacheKey, { data: defaultData, timestamp: Date.now() });
      const response = Response.json(defaultData);
      response.headers.set('Cache-Control', 'public, max-age=300'); // 5 минут кэширования
      return response;
    }

    console.error('Ошибка получения общих настроек:', error);
    // Возвращаем значения по умолчанию в случае любой ошибки
    const defaultResponse = Response.json({
      id: '',
      site_title: 'Каталог',
      site_icon: '/favicon.ico',
      site_footer_info: '© 2026 Каталог. Все права защищены.',
      bg_image: '', // Добавляем новое поле
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // Добавляем заголовки для кэширования даже в случае ошибки
    defaultResponse.headers.set('Cache-Control', 'public, max-age=300');
    return defaultResponse;
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { site_title, site_icon, site_footer_info, bg_image } = await request.json();

    // Используем сервис для обновления настроек (функция сама решит, обновлять или создавать)
    const updateResult = await import('@/services/general-settings-service')
      .then(mod => mod.updateGeneralSettings({
        site_title,
        site_icon,
        site_footer_info,
        bg_image
      }));

    if (updateResult) {
      // Инвалидируем кэш после успешного обновления
      global.generalSettingsCache!.delete('general_settings');

      return Response.json({ success: true });
    } else {
      return Response.json({
        error: 'Ошибка обновления настроек'
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Ошибка обновления общих настроек:', error);
    return Response.json({
      error: error.message || 'Ошибка обновления настроек'
    }, { status: 500 });
  }
}