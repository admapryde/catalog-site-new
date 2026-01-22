import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { revalidateTag } from 'next/cache';

export interface FooterSettings {
  footer_catalog_title: string;
  footer_catalog_desc: string;
  footer_contacts_title: string;
  footer_quick_links_title: string;
  contacts: Array<{id: string, value: string}>;
  quick_links: Array<{id: string, label: string, url: string}>;
}

export async function GET(request: NextRequest) {
  try {
    // Используем прямой клиент Supabase без сессии, так как эти данные публичные
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Получаем общие настройки футера
    const { data: generalData, error: generalError } = await supabase
      .from('footer_settings')
      .select('setting_key, setting_value')
      .eq('setting_type', 'general');

    if (generalError) {
      console.error('Ошибка получения общих настроек футера:', generalError.message || generalError);
      // Возвращаем значения по умолчанию
      const defaultData = {
        footer_catalog_title: 'Каталог',
        footer_catalog_desc: 'Универсальная платформа для создания каталогов продукции различных отраслей.',
        footer_contacts_title: 'Контакты',
        footer_quick_links_title: 'Быстрые ссылки',
        contacts: [],
        quick_links: []
      };

      const response = Response.json(defaultData);
      response.headers.set('Cache-Control', 'public, s-maxage=60'); // Кэшируем на 1 минуту в случае ошибки
      return response;
    }

    // Получаем контактные данные
    const { data: contactsData, error: contactsError } = await supabase
      .from('footer_settings')
      .select('id, setting_value')
      .eq('setting_type', 'contact')
      .order('position', { ascending: true });

    if (contactsError) {
      console.error('Ошибка получения контактных данных футера:', contactsError.message || contactsError);
    }

    // Получаем быстрые ссылки
    const { data: linksData, error: linksError } = await supabase
      .from('footer_settings')
      .select('id, setting_value, position')
      .eq('setting_type', 'quick_link')
      .order('position', { ascending: true });

    if (linksError) {
      console.error('Ошибка получения быстрых ссылок футера:', linksError.message || linksError);
    }

    // Преобразуем полученные данные в нужный формат
    const settings: Partial<FooterSettings> = {};
    generalData?.forEach(item => {
      if (item.setting_key) {
        (settings as any)[item.setting_key] = item.setting_value || '';
      }
    });

    // Обрабатываем контактные данные
    const contacts = contactsData?.map(contact => ({
      id: contact.id,
      value: contact.setting_value || ''
    })) || [];

    // Обрабатываем быстрые ссылки (парсим JSON)
    const quick_links = linksData?.map(link => {
      try {
        const parsed = JSON.parse(link.setting_value || '{}');
        return {
          id: link.id,
          label: parsed.label || '',
          url: parsed.url || ''
        };
      } catch (e) {
        console.error('Ошибка парсинга быстрой ссылки:', e);
        return {
          id: link.id,
          label: '',
          url: ''
        };
      }
    }) || [];

    // Возвращаем настройки, заполняя недостающие значения по умолчанию
    const finalResult = {
      footer_catalog_title: settings.footer_catalog_title || 'Каталог',
      footer_catalog_desc: settings.footer_catalog_desc || 'Универсальная платформа для создания каталогов продукции различных отраслей.',
      footer_contacts_title: settings.footer_contacts_title || 'Контакты',
      footer_quick_links_title: settings.footer_quick_links_title || 'Быстрые ссылки',
      contacts,
      quick_links
    };

    const response = Response.json(finalResult);
    // Устанавливаем HTTP кэширование на 5 минут, но с возможностью немедленной инвалидации через теги
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return response;
  } catch (error) {
    console.error('Ошибка получения настроек футера:', error);
    // Возвращаем значения по умолчанию в случае ошибки
    const defaultData = {
      footer_catalog_title: 'Каталог',
      footer_catalog_desc: 'Универсальная платформа для создания каталогов продукции различных отраслей.',
      footer_contacts_title: 'Контакты',
      footer_quick_links_title: 'Быстрые ссылки',
      contacts: [],
      quick_links: []
    };

    const response = Response.json(defaultData);
    response.headers.set('Cache-Control', 'public, s-maxage=60'); // Кэшируем на 1 минуту в случае ошибки
    return response;
  }
}

// Для возможности инвалидировать кэш при обновлении настроек
export async function POST(request: NextRequest) {
  // Инвалидируем кэш при получении POST запроса
  revalidateTag('footer_settings', 'max');

  return Response.json({ success: true });
}