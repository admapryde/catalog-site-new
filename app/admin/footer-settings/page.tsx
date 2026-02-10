import { requireAdminSession } from '@/components/ProtectedRoute';
import { createClient } from '@/lib/supabase-server';
import AdminSidebar from '@/components/admin/AdminSidebar';
import FooterSettingsForm from '@/components/admin/FooterSettingsForm';
import ClientOnlyAdminPageWrapper from '@/components/admin/ClientOnlyAdminPageWrapper';
import { cookies } from 'next/headers';

interface FooterSettings {
  footer_catalog_title: string;
  footer_catalog_desc: string;
  footer_contacts_title: string;
  footer_quick_links_title: string;
  contacts: Array<{id: string, value: string}>;
  quick_links: Array<{id: string, label: string, url: string}>;
}

async function getFooterSettings(): Promise<FooterSettings> {
  const supabase = await createClient();

  try {
    // Получаем общие настройки футера
    const { data: generalData, error: generalError } = await supabase
      .from('footer_settings')
      .select('setting_key, setting_value')
      .eq('setting_type', 'general');

    if (generalError) {
      console.error('Ошибка получения общих настроек футера:', generalError);
      // Возвращаем значения по умолчанию
      return {
        footer_catalog_title: 'Каталог',
        footer_catalog_desc: 'Универсальная платформа для создания каталогов продукции различных отраслей.',
        footer_contacts_title: 'Контакты',
        footer_quick_links_title: 'Быстрые ссылки',
        contacts: [],
        quick_links: []
      };
    }

    // Получаем контактные данные
    const { data: contactsData, error: contactsError } = await supabase
      .from('footer_settings')
      .select('id, setting_value')
      .eq('setting_type', 'contact')
      .order('position', { ascending: true });

    if (contactsError) {
      console.error('Ошибка получения контактных данных футера:', contactsError);
    }

    // Получаем быстрые ссылки
    const { data: linksData, error: linksError } = await supabase
      .from('footer_settings')
      .select('id, setting_value, position')
      .eq('setting_type', 'quick_link')
      .order('position', { ascending: true });

    if (linksError) {
      console.error('Ошибка получения быстрых ссылок футера:', linksError);
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
  } catch (err) {
    console.error('Неожиданная ошибка получения настроек футера:', err);
    // Возвращаем значения по умолчанию в случае любой ошибки
    return {
      footer_catalog_title: 'Каталог',
      footer_catalog_desc: 'Универсальная платформа для создания каталогов продукции различных отраслей.',
      footer_contacts_title: 'Контакты',
      footer_quick_links_title: 'Быстрые ссылки',
      contacts: [],
      quick_links: []
    };
  }
}

import { revalidateTag } from 'next/cache';
import { headers } from 'next/headers';

async function updateFooterSettings(formData: FormData) {
  'use server';

  await requireAdminSession();

  try {
    // Подготовим данные для отправки
    const footer_catalog_title = formData.get('footer_catalog_title') as string;
    const footer_catalog_desc = formData.get('footer_catalog_desc') as string;
    const footer_contacts_title = formData.get('footer_contacts_title') as string;
    const footer_quick_links_title = formData.get('footer_quick_links_title') as string;

    // Подготовим контактные данные
    const contacts = [];
    for (let i = 0; i < 8; i++) {
      const contactValue = formData.get(`contact_${i}`) as string;
      if (contactValue && contactValue.trim() !== '') {
        contacts.push({ id: `contact_${i}`, value: contactValue });
      }
    }

    // Подготовим быстрые ссылки
    const quick_links = [];
    for (let i = 0; i < 8; i++) {
      const linkLabel = formData.get(`quick_link_label_${i}`) as string;
      const linkUrl = formData.get(`quick_link_url_${i}`) as string;

      if (linkLabel && linkLabel.trim() !== '' && linkUrl && linkUrl.trim() !== '') {
        quick_links.push({ id: `quick_link_${i}`, label: linkLabel, url: linkUrl });
      }
    }

    // Получаем куки для передачи аутентификационных данных
    const cookieStore = await cookies();

    // Получаем все Supabase куки
    const supabaseCookies = [];
    const allCookies = cookieStore.getAll();
    for (const cookie of allCookies) {
      if (cookie.name.startsWith('sb-')) {
        supabaseCookies.push(`${cookie.name}=${cookie.value}`);
      }
    }

    const cookieHeader = supabaseCookies.join('; ');

    // Отправляем PUT-запрос к API маршруту для обновления настроек
    const headersList = await headers();
    const referer = headersList.get('referer');
    let baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    if (referer) {
      try {
        const refererUrl = new URL(referer);
        baseUrl = `${refererUrl.protocol}//${refererUrl.host}`;
      } catch (e) {
        console.warn('Could not parse referer URL, using default base URL');
      }
    }

    const response = await fetch(`${baseUrl}/api/footer-settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader, // Передаем аутентификационные куки
      },
      body: JSON.stringify({
        footer_catalog_title,
        footer_catalog_desc,
        footer_contacts_title,
        footer_quick_links_title,
        contacts,
        quick_links
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Ошибка обновления настроек футера:', errorData);
      throw new Error(errorData.error || 'Ошибка обновления настроек');
    }

    // Инвалидируем кэш для настроек футера
    revalidateTag('footer_settings', 'max');
  } catch (error) {
    console.error('Ошибка обновления настроек футера:', error);
    // Не выбрасываем ошибку дальше, чтобы форма не ломалась
    // В реальной системе можно добавить более сложную обработку ошибок
  }
}

export default async function FooterSettingsPage() {
  // Проверяем сессию администратора
  await requireAdminSession();

  const settings = await getFooterSettings();

  return (
    <ClientOnlyAdminPageWrapper>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Настройки подвала</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Основные параметры</h2>
        <FooterSettingsForm initialSettings={settings} updateAction={updateFooterSettings} />
      </div>
    </ClientOnlyAdminPageWrapper>
  );
}