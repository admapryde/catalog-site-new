import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createAPIClient } from '@/lib/supabase-server';
import { revalidateTag } from 'next/cache';
import { getAdminSessionFromRequest } from '@/services/admin-auth-service';

export interface HeaderSettings {
  header_title: string;
  nav_home: string;
  nav_catalog: string;
  nav_about: string;
  nav_contacts: string;
  contact: string;
  logo_image_url: string;
}

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

// Получаем настройки шапки сайта (без кэширования в unstable_cache из-за ограничений на динамические данные)
async function getHeaderSettings() {
  try {
    // Используем прямой клиент Supabase без сессии, так как эти данные публичные
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Получаем все настройки шапки сайта
    const { data, error } = await supabase
      .from('site_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['header_title', 'nav_home', 'nav_catalog', 'nav_about', 'nav_contacts', 'contact', 'logo_image_url']);

    if (error) {
      console.error('Ошибка получения настроек шапки:', error.message || error);
      // Возвращаем значения по умолчанию
      return {
        header_title: 'Каталог',
        nav_home: 'Главная',
        nav_catalog: 'Каталог',
        nav_about: 'О нас',
        nav_contacts: 'Контакты',
        contact: '+7 (XXX) XXX-XX-XX',
        logo_image_url: ''
      };
    }

    // Преобразуем полученные данные в нужный формат
    const settings: Partial<HeaderSettings> = {};
    data?.forEach(item => {
      if (item.setting_key) {
        (settings as any)[item.setting_key] = item.setting_value || '';
      }
    });

    // Возвращаем настройки, заполняя недостающие значения по умолчанию
    return {
      header_title: settings.header_title || 'Каталог',
      nav_home: settings.nav_home || 'Главная',
      nav_catalog: settings.nav_catalog || 'Каталог',
      nav_about: settings.nav_about || 'О нас',
      nav_contacts: settings.nav_contacts || 'Контакты',
      contact: settings.contact || '+7 (XXX) XXX-XX-XX',
      logo_image_url: settings.logo_image_url || ''
    };
  } catch (error) {
    console.error('Ошибка получения настроек шапки:', error);
    // Возвращаем значения по умолчанию в случае ошибки
    return {
      header_title: 'Каталог',
      nav_home: 'Главная',
      nav_catalog: 'Каталог',
      nav_about: 'О нас',
      nav_contacts: 'Контакты'
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    const settings = await getHeaderSettings();

    const response = Response.json(settings);
    // Устанавливаем HTTP кэширование на 5 минут, но с возможностью немедленной инвалидации через теги
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return response;
  } catch (error) {
    console.error('Ошибка получения настроек шапки:', error);
    // Возвращаем значения по умолчанию в случае ошибки
    const defaultData = {
      header_title: 'Каталог',
      nav_home: 'Главная',
      nav_catalog: 'Каталог',
      nav_about: 'О нас',
      nav_contacts: 'Контакты',
      contact: '+7 (XXX) XXX-XX-XX',
      logo_image_url: ''
    };

    const response = Response.json(defaultData);
    response.headers.set('Cache-Control', 'public, s-maxage=60'); // Кэшируем на 1 минуту в случае ошибки
    return response;
  }
}

// Для возможности инвалидировать кэш при обновлении настроек
export async function POST(request: NextRequest) {
  // Инвалидируем кэш при получении POST запроса
  revalidateTag('header_settings', 'max');

  return Response.json({ success: true });
}

export async function PUT(request: NextRequest) {
  // Проверяем, что пользователь аутентифицирован как администратор
  const adminUser = await getAdminSessionFromRequest(request);
  if (!adminUser) {
    return Response.json({ error: 'Требуется аутентификация администратора' }, { status: 401 });
  }

  try {
    const {
      header_title,
      nav_home,
      nav_catalog,
      nav_about,
      nav_contacts,
      contact,
      logo_image_url
    } = await request.json();

    // Try using service role client for admin operations to bypass RLS if needed
    // First, try with the regular client using the request object
    const supabase = await createAPIClient(request);

    // Обновляем или создаем настройки в базе данных
    const settings = [
      { setting_key: 'header_title', setting_value: header_title },
      { setting_key: 'nav_home', setting_value: nav_home },
      { setting_key: 'nav_catalog', setting_value: nav_catalog },
      { setting_key: 'nav_about', setting_value: nav_about },
      { setting_key: 'nav_contacts', setting_value: nav_contacts },
      { setting_key: 'contact', setting_value: contact },
      { setting_key: 'logo_image_url', setting_value: logo_image_url }
    ];

    for (const setting of settings) {
      const { error } = await supabase
        .from('site_settings')
        .upsert(setting, { onConflict: 'setting_key' });

      if (error) {
        console.error('Ошибка обновления настройки:', error.message || error);

        // Если это ошибка доступа, пробуем использовать service role клиента
        if (error.code === '42501' || error.message?.includes('permission denied')) {
          console.warn('Обнаружена ошибка доступа, используем service role клиента для настроек шапки');

          try {
            const serviceRoleClient = createServiceRoleClient();

            const { error: serviceError } = await serviceRoleClient
              .from('site_settings')
              .upsert(setting, { onConflict: 'setting_key' });

            if (serviceError) {
              console.error('Ошибка обновления настройки через service role:', serviceError.message || serviceError);
              return Response.json({
                error: 'Ошибка обновления настроек'
              }, { status: 500 });
            }
          } catch (serviceRoleError) {
            console.error('Ошибка при создании service role клиента:', serviceRoleError);
            return Response.json({
              error: 'Ошибка обновления настроек'
            }, { status: 500 });
          }
        } else {
          return Response.json({
            error: 'Ошибка обновления настроек'
          }, { status: 500 });
        }
      }
    }

    // Инвалидируем кэш для настроек шапки сайта
    revalidateTag('header_settings', 'max');

    return Response.json({ success: true });
  } catch (error: any) {
    console.error('Ошибка обновления настроек шапки:', error);
    return Response.json({
      error: error.message || 'Ошибка обновления настроек'
    }, { status: 500 });
  }
}