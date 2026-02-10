import { requireAdminSession } from '@/components/ProtectedRoute';
import { createClient } from '@/lib/supabase-server';
import AdminSidebar from '@/components/admin/AdminSidebar';
import HeaderSettingsForm from '@/components/admin/HeaderSettingsForm';
import ClientOnlyAdminPageWrapper from '@/components/admin/ClientOnlyAdminPageWrapper';
import { headers, cookies } from 'next/headers';

interface HeaderSettings {
  header_title: string;
  nav_home: string;
  nav_catalog: string;
  nav_about: string;
  nav_contacts: string;
  contact: string;
  logo_image_url: string;
}

async function getHeaderSettings(): Promise<HeaderSettings> {
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
      nav_contacts: settings.nav_contacts || 'Каталог',
      contact: settings.contact || '+7 (XXX) XXX-XX-XX',
      logo_image_url: settings.logo_image_url || ''
    };
  } catch (err) {
    console.error('Неожиданная ошибка получения настроек шапки:', err);
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

import { revalidateTag } from 'next/cache';

async function updateHeaderSettings(formData: FormData) {
  'use server';

  await requireAdminSession();

  try {
    const header_title = formData.get('header_title') as string;
    const nav_home = formData.get('nav_home') as string;
    const nav_catalog = formData.get('nav_catalog') as string;
    const nav_about = formData.get('nav_about') as string;
    const nav_contacts = formData.get('nav_contacts') as string;
    const contact = formData.get('contact') as string;
    const logo_image_url = formData.get('logo_image_url') as string;

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

    const response = await fetch(`${baseUrl}/api/header-settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader, // Передаем аутентификационные куки
      },
      body: JSON.stringify({
        header_title,
        nav_home,
        nav_catalog,
        nav_about,
        nav_contacts,
        contact,
        logo_image_url
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Ошибка обновления настроек шапки:', errorData);
      throw new Error(errorData.error || 'Ошибка обновления настроек');
    }

    // Инвалидируем кэш для настроек шапки сайта
    revalidateTag('header_settings', 'max');
  } catch (error) {
    console.error('Ошибка обновления настроек шапки:', error);
    // Не выбрасываем ошибку дальше, чтобы форма не ломалась
    // В реальной системе можно добавить более сложную обработку ошибок
  }
}

export default async function HeaderSettingsPage() {
  // Проверяем сессию администратора
  await requireAdminSession();

  const settings = await getHeaderSettings();

  return (
    <ClientOnlyAdminPageWrapper>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Настройки шапки сайта</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Основные параметры</h2>
        <HeaderSettingsForm initialSettings={settings} updateAction={updateHeaderSettings} />
      </div>
    </ClientOnlyAdminPageWrapper>
  );
}