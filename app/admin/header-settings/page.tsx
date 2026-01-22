import { requireAdminSession } from '@/components/ProtectedRoute';
import { createClient } from '@/lib/supabase-server';
import AdminSidebar from '@/components/admin/AdminSidebar';
import HeaderSettingsForm from '@/components/admin/HeaderSettingsForm';
import { headers } from 'next/headers';

interface HeaderSettings {
  header_title: string;
  nav_home: string;
  nav_catalog: string;
  nav_about: string;
  nav_contacts: string;
}

async function getHeaderSettings(): Promise<HeaderSettings> {
  const supabase = await createClient();

  try {
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
  } catch (err) {
    console.error('Неожиданная ошибка получения настроек шапки:', err);
    // Возвращаем значения по умолчанию в случае любой ошибки
    return {
      header_title: 'Каталог',
      nav_home: 'Главная',
      nav_catalog: 'Каталог',
      nav_about: 'О нас',
      nav_contacts: 'Контакты'
    };
  }
}

import { revalidateTag } from 'next/cache';

async function updateHeaderSettings(formData: FormData) {
  'use server';

  await requireAdminSession();

  try {
    const supabase = await createClient();

    const header_title = formData.get('header_title') as string;
    const nav_home = formData.get('nav_home') as string;
    const nav_catalog = formData.get('nav_catalog') as string;
    const nav_about = formData.get('nav_about') as string;
    const nav_contacts = formData.get('nav_contacts') as string;

    // Обновляем или создаем настройки в базе данных
    const settings = [
      { setting_key: 'header_title', setting_value: header_title },
      { setting_key: 'nav_home', setting_value: nav_home },
      { setting_key: 'nav_catalog', setting_value: nav_catalog },
      { setting_key: 'nav_about', setting_value: nav_about },
      { setting_key: 'nav_contacts', setting_value: nav_contacts }
    ];

    for (const setting of settings) {
      const { error } = await supabase
        .from('site_settings')
        .upsert(setting, { onConflict: 'setting_key' });

      if (error) {
        console.error('Ошибка обновления настройки:', error.message || error);
        throw error;
      }
    }

    // Инвалидируем кэш для настроек шапки сайта
    revalidateTag('header_settings', 'max');

    // Вызываем POST-запрос к API для дополнительной инвалидации кэша
    try {
      // Получаем текущий URL из заголовков
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

      await fetch(`${baseUrl}/api/header-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (apiError) {
      console.error('Ошибка при инвалидации кэша через API:', apiError);
    }
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
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <AdminSidebar />

        {/* Основной контент */}
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Шапка сайта</h1>

            <HeaderSettingsForm initialSettings={settings} updateAction={updateHeaderSettings} />
          </div>
        </main>
      </div>
    </div>
  );
}