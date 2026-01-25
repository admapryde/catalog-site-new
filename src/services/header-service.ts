import { createClient } from '@/lib/supabase-server';

// Define type for header settings
export interface HeaderSettings {
  header_title: string;
  nav_home: string;
  nav_catalog: string;
  nav_about: string;
  nav_contacts: string;
  contact: string;
  logo_image_url: string;
}

export async function getHeaderSettings(): Promise<HeaderSettings> {
  const supabase = await createClient();

  try {
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
    // Возвращаем значения по умолчанию в случае любой ошибки
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
}