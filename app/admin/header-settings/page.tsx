import { requireAdminSession } from '@/components/ProtectedRoute';
import { createClient } from '@/lib/supabase-server';

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

    // После успешного обновления перенаправляем на ту же страницу, чтобы показать обновленные данные
    // Но поскольку это Server Action, мы не можем использовать redirect здесь
    // Вместо этого просто завершаем функцию успешно
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
        {/* Сайдбар */}
        <aside className="w-64 bg-white shadow-md min-h-screen">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800">Админ-панель</h2>
          </div>
          <nav className="mt-6">
            <ul>
              <li>
                <a href="/admin" className="block py-3 px-6 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 border-transparent">
                  Дашборд
                </a>
              </li>
              <li>
                <a href="/admin/categories" className="block py-3 px-6 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 border-transparent">
                  Разделы
                </a>
              </li>
              <li>
                <a href="/admin/banner-groups" className="block py-3 px-6 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 border-transparent">
                  Баннеры
                </a>
              </li>
              <li>
                <a href="/admin/homepage-sections" className="block py-3 px-6 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 border-transparent">
                  Разделы ГС
                </a>
              </li>
              <li>
                <a href="/admin/products" className="block py-3 px-6 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 border-transparent">
                  Товары
                </a>
              </li>
              <li>
                <a href="/admin/header-settings" className="block py-3 px-6 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 border-blue-600 bg-blue-50">
                  Шапка сайта
                </a>
              </li>
              <li>
                <a href="/admin/settings" className="block py-3 px-6 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 border-transparent">
                  Настройки
                </a>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Основной контент */}
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Шапка сайта</h1>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Настройки шапки сайта</h2>
              
              <form action={updateHeaderSettings}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="header_title">
                      Заголовок (логотип)
                    </label>
                    <input
                      id="header_title"
                      name="header_title"
                      type="text"
                      defaultValue={settings.header_title}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nav_home">
                      Навигация: Главная
                    </label>
                    <input
                      id="nav_home"
                      name="nav_home"
                      type="text"
                      defaultValue={settings.nav_home}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nav_catalog">
                      Навигация: Каталог
                    </label>
                    <input
                      id="nav_catalog"
                      name="nav_catalog"
                      type="text"
                      defaultValue={settings.nav_catalog}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nav_about">
                      Навигация: О нас
                    </label>
                    <input
                      id="nav_about"
                      name="nav_about"
                      type="text"
                      defaultValue={settings.nav_about}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nav_contacts">
                      Навигация: Контакты
                    </label>
                    <input
                      id="nav_contacts"
                      name="nav_contacts"
                      type="text"
                      defaultValue={settings.nav_contacts}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Сохранить изменения
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}