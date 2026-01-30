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

import { getAdminSessionFromRequest } from '@/services/admin-auth-service';
import { createClient } from '@supabase/supabase-js';

// Create a service role client for admin operations
function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Отсутствуют переменные окружения для Supabase SERVICE ROLE');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  });
}

export async function PUT(request: NextRequest) {
  // Проверяем, что пользователь аутентифицирован как администратор
  const adminUser = await getAdminSessionFromRequest(request);
  if (!adminUser) {
    return Response.json({ error: 'Требуется аутентификация администратора' }, { status: 401 });
  }

  try {
    const { site_title, site_icon, site_footer_info, bg_image } = await request.json();

    // Try using service role client for admin operations to bypass RLS if needed
    let supabase = await createAPIClient(request);

    // First, try to determine if we need to use service role client based on common permission errors
    // If the regular client fails with permission errors, we'll use the service role client

    // Сначала получаем существующую запись, чтобы получить её ID
    const { data: existingData, error: selectError } = await supabase
      .from('general_settings')
      .select('id')
      .limit(1);

    if (selectError) {
      // Проверяем, является ли ошибка связанной с отсутствием таблицы
      if (selectError.code === '42P01' || selectError.message?.includes('does not exist')) {
        console.error('Таблица general_settings не существует, невозможно обновить настройки');
        return Response.json({
          error: 'Таблица general_settings не существует'
        }, { status: 500 });
      }

      // If it's a permission error, try using service role client
      if (selectError.code === '42501' || selectError.message?.includes('permission denied')) {
        console.warn('Permission error detected, attempting to use service role client for general settings');
        const serviceRoleClient = createServiceRoleClient();

        const { data: existingDataSR, error: selectErrorSR } = await serviceRoleClient
          .from('general_settings')
          .select('id')
          .limit(1);

        if (selectErrorSR) {
          console.error('Ошибка получения ID настроек через service role:', selectErrorSR.message || selectErrorSR);
          return Response.json({
            error: 'Ошибка получения данных'
          }, { status: 500 });
        }

        if (!existingDataSR || existingDataSR.length === 0) {
          // Если запись не существует, создаем новую через service role
          const { error: insertError } = await serviceRoleClient
            .from('general_settings')
            .insert([{
              site_title,
              site_icon,
              site_footer_info,
              bg_image,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }]);

          if (insertError) {
            console.error('Ошибка создания настроек через service role:', insertError.message || insertError);
            return Response.json({
              error: 'Ошибка создания настроек'
            }, { status: 500 });
          }
        } else {
          // Обновляем общие настройки сайта по ID через service role
          const { error } = await serviceRoleClient
            .from('general_settings')
            .update({
              site_title,
              site_icon,
              site_footer_info,
              bg_image,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingDataSR[0].id);

          if (error) {
            console.error('Ошибка обновления общих настроек через service role:', error.message || error);
            return Response.json({
              error: 'Ошибка обновления настроек'
            }, { status: 500 });
          }
        }
      } else {
        console.error('Ошибка получения ID настроек:', selectError.message || selectError);
        return Response.json({
          error: 'Ошибка получения данных'
        }, { status: 500 });
      }
    } else {
      let updateResult;

      if (!existingData || existingData.length === 0) {
        // Если запись не существует, создаем новую
        const { error: insertError } = await supabase
          .from('general_settings')
          .insert([{
            site_title,
            site_icon,
            site_footer_info,
            bg_image,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (insertError) {
          // If regular client fails with permission error, try service role client
          if (insertError.code === '42501' || insertError.message?.includes('permission denied')) {
            console.warn('Permission error on insert, using service role client for general settings');
            const serviceRoleClient = createServiceRoleClient();

            const { error: insertErrorSR } = await serviceRoleClient
              .from('general_settings')
              .insert([{
                site_title,
                site_icon,
                site_footer_info,
                bg_image,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }]);

            if (insertErrorSR) {
              console.error('Ошибка создания настроек через service role:', insertErrorSR.message || insertErrorSR);
              return Response.json({
                error: 'Ошибка создания настроек'
              }, { status: 500 });
            }
          } else {
            console.error('Ошибка создания настроек:', insertError.message || insertError);
            return Response.json({
              error: 'Ошибка создания настроек'
            }, { status: 500 });
          }

          updateResult = true;
        } else {
          updateResult = true;
        }
      } else {
        // Обновляем общие настройки сайта по ID
        const { error } = await supabase
          .from('general_settings')
          .update({
            site_title,
            site_icon,
            site_footer_info,
            bg_image,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingData[0].id); // Используем ID для обновления конкретной записи

        if (error) {
          // Проверяем, является ли ошибка связанной с отсутствием таблицы
          if (error.code === '42P01' || error.message?.includes('does not exist')) {
            console.error('Таблица general_settings не существует, невозможно обновить настройки');
            return Response.json({
              error: 'Таблица general_settings не существует'
            }, { status: 500 });
          }

          // If it's a permission error, try using service role client
          if (error.code === '42501' || error.message?.includes('permission denied')) {
            console.warn('Permission error on update, using service role client for general settings');
            const serviceRoleClient = createServiceRoleClient();

            const { error: updateErrorSR } = await serviceRoleClient
              .from('general_settings')
              .update({
                site_title,
                site_icon,
                site_footer_info,
                bg_image,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingData[0].id);

            if (updateErrorSR) {
              console.error('Ошибка обновления настроек через service role:', updateErrorSR.message || updateErrorSR);
              return Response.json({
                error: 'Ошибка обновления настроек'
              }, { status: 500 });
            }
          } else {
            console.error('Ошибка обновления общих настроек:', error.message || error);
            return Response.json({
              error: 'Ошибка обновления настроек'
            }, { status: 500 });
          }

          updateResult = true;
        } else {
          updateResult = true;
        }
      }

      if (updateResult) {
        // Инвалидируем кэш после успешного обновления
        global.generalSettingsCache!.delete('general_settings');

        return Response.json({ success: true });
      } else {
        return Response.json({
          error: 'Ошибка обновления настроек'
        }, { status: 500 });
      }
    }

    // Инвалидируем кэш после успешного обновления
    global.generalSettingsCache!.delete('general_settings');

    return Response.json({ success: true });
  } catch (error: any) {
    console.error('Ошибка обновления общих настроек:', error);
    return Response.json({
      error: error.message || 'Ошибка обновления настроек'
    }, { status: 500 });
  }
}