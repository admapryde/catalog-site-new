import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { revalidateTag } from 'next/cache';

export interface HeaderSettings {
  header_title: string;
  nav_home: string;
  nav_catalog: string;
  nav_about: string;
  nav_contacts: string;
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
      .in('setting_key', ['header_title', 'nav_home', 'nav_catalog', 'nav_about', 'nav_contacts']);

    if (error) {
      console.error('Ошибка получения настроек шапки:', error.message || error);
      // Возвращаем значения по умолчанию
      return {
        header_title: 'Каталог',
        nav_home: 'Главная',
        nav_catalog: 'Каталог',
        nav_about: 'О нас',
        nav_contacts: 'Контакты'
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
      nav_contacts: settings.nav_contacts || 'Контакты'
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
      nav_contacts: 'Контакты'
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