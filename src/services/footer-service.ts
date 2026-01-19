import { createClient } from '@/lib/supabase-server';

// Define type for footer settings
export interface FooterSettings {
  footer_catalog_title: string;
  footer_catalog_desc: string;
  footer_contacts_title: string;
  footer_quick_links_title: string;
  contacts: Array<{id: string, value: string}>;
  quick_links: Array<{id: string, label: string, url: string}>;
}

export async function getFooterSettings(): Promise<FooterSettings> {
  try {
    const supabase = await createClient();

    // Получаем общие настройки футера
    const { data: generalData, error: generalError } = await supabase
      .from('footer_settings')
      .select('setting_key, setting_value')
      .eq('setting_type', 'general');

    if (generalError) {
      console.error('Ошибка получения общих настроек футера:', generalError.message || generalError);
      // Возвращаем значения по умолчанию
      return {
        footer_catalog_title: 'Каталог',
        footer_catalog_desc: 'Универсальная платформа для создания каталогов продукции различных отраслей.',
        footer_contacts_title: 'Контакты',
        footer_quick_links_title: 'Быстрые ссылки',
        contacts: [
          { id: '1', value: '📧 info@catalog.example' },
          { id: '2', value: '📞 +7 (XXX) XXX-XX-XX' },
          { id: '3', value: '📍 Москва, ул. Примерная, д. 1' }
        ],
        quick_links: [
          { id: '1', label: 'Главная', url: '/' },
          { id: '2', label: 'Каталог', url: '/catalog' },
          { id: '3', label: 'О нас', url: '/about' },
          { id: '4', label: 'Контакты', url: '/contacts' }
        ]
      };
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
    return {
      footer_catalog_title: settings.footer_catalog_title || 'Каталог',
      footer_catalog_desc: settings.footer_catalog_desc || 'Универсальная платформа для создания каталогов продукции различных отраслей.',
      footer_contacts_title: settings.footer_contacts_title || 'Контакты',
      footer_quick_links_title: settings.footer_quick_links_title || 'Быстрые ссылки',
      contacts,
      quick_links
    };
  } catch (error) {
    console.error('Ошибка получения настроек футера:', error);
    // В случае ошибки возвращаем значения по умолчанию
    return {
      footer_catalog_title: 'Каталог',
      footer_catalog_desc: 'Универсальная платформа для создания каталогов продукции различных отраслей.',
      footer_contacts_title: 'Контакты',
      footer_quick_links_title: 'Быстрые ссылки',
      contacts: [
        { id: '1', value: '📧 info@catalog.example' },
        { id: '2', value: '📞 +7 (XXX) XXX-XX-XX' },
        { id: '3', value: '📍 Москва, ул. Примерная, д. 1' }
      ],
      quick_links: [
        { id: '1', label: 'Главная', url: '/' },
        { id: '2', label: 'Каталог', url: '/catalog' },
        { id: '3', label: 'О нас', url: '/about' },
        { id: '4', label: 'Контакты', url: '/contacts' }
      ]
    };
  }
}