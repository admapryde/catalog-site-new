import { requireAdminSession } from '@/components/ProtectedRoute';
import { createClient } from '@/lib/supabase-server';

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

async function updateFooterSettings(formData: FormData) {
  'use server';

  await requireAdminSession();

  try {
    const supabase = await createClient();

    // Обновляем общие настройки
    const footer_catalog_title = formData.get('footer_catalog_title') as string;
    const footer_catalog_desc = formData.get('footer_catalog_desc') as string;
    const footer_contacts_title = formData.get('footer_contacts_title') as string;
    const footer_quick_links_title = formData.get('footer_quick_links_title') as string;

    // Сначала удаляем старые общие настройки
    const { error: deleteGeneralError } = await supabase
      .from('footer_settings')
      .delete()
      .eq('setting_type', 'general');

    if (deleteGeneralError) {
      console.error('Ошибка удаления старых общих настроек футера:', deleteGeneralError.message || deleteGeneralError);
      throw deleteGeneralError;
    }

    // Добавляем новые общие настройки
    const generalSettings = [
      { setting_key: 'footer_catalog_title', setting_value: footer_catalog_title, setting_type: 'general' },
      { setting_key: 'footer_catalog_desc', setting_value: footer_catalog_desc, setting_type: 'general' },
      { setting_key: 'footer_contacts_title', setting_value: footer_contacts_title, setting_type: 'general' },
      { setting_key: 'footer_quick_links_title', setting_value: footer_quick_links_title, setting_type: 'general' }
    ];

    const { error: insertGeneralError } = await supabase
      .from('footer_settings')
      .insert(generalSettings);

    if (insertGeneralError) {
      console.error('Ошибка добавления общих настроек футера:', insertGeneralError.message || insertGeneralError);
      throw insertGeneralError;
    }

    // Обрабатываем контактные данные
    // Сначала удаляем старые контактные данные
    const { error: deleteContactsError } = await supabase
      .from('footer_settings')
      .delete()
      .eq('setting_type', 'contact');

    if (deleteContactsError) {
      console.error('Ошибка удаления старых контактных данных:', deleteContactsError.message || deleteContactsError);
      throw deleteContactsError;
    }

    // Добавляем новые контактные данные
    for (let i = 0; i < 8; i++) {
      const contactValue = formData.get(`contact_${i}`) as string;
      if (contactValue && contactValue.trim() !== '') {
        const { error: insertContactError } = await supabase
          .from('footer_settings')
          .insert({
            setting_key: `contact_${i}`,
            setting_value: contactValue,
            setting_type: 'contact',
            position: i
          });

        if (insertContactError) {
          console.error('Ошибка добавления контактной информации:', insertContactError.message || insertContactError);
          throw insertContactError;
        }
      }
    }

    // Обрабатываем быстрые ссылки
    // Сначала удаляем старые быстрые ссылки
    const { error: deleteLinksError } = await supabase
      .from('footer_settings')
      .delete()
      .eq('setting_type', 'quick_link');

    if (deleteLinksError) {
      console.error('Ошибка удаления старых быстрых ссылок:', deleteLinksError.message || deleteLinksError);
      throw deleteLinksError;
    }

    // Добавляем новые быстрые ссылки
    for (let i = 0; i < 8; i++) {
      const linkLabel = formData.get(`quick_link_label_${i}`) as string;
      const linkUrl = formData.get(`quick_link_url_${i}`) as string;

      if (linkLabel && linkLabel.trim() !== '' && linkUrl && linkUrl.trim() !== '') {
        const linkData = JSON.stringify({ label: linkLabel, url: linkUrl });

        const { error: insertLinkError } = await supabase
          .from('footer_settings')
          .insert({
            setting_key: `quick_link_${i}`,
            setting_value: linkData,
            setting_type: 'quick_link',
            position: i
          });

        if (insertLinkError) {
          console.error('Ошибка добавления быстрой ссылки:', insertLinkError.message || insertLinkError);
          throw insertLinkError;
        }
      }
    }

    console.log('Настройки футера успешно обновлены');
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
                <a href="/admin/header-settings" className="block py-3 px-6 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 border-transparent">
                  Шапка сайта
                </a>
              </li>
              <li>
                <a href="/admin/footer-settings" className="block py-3 px-6 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 border-blue-600 bg-blue-50">
                  Футтер
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
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Футтер</h1>

            <form action={updateFooterSettings}>
              {/* Настройки блока "Каталог" */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Блок "Каталог"</h2>
                
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="footer_catalog_title">
                    Название блока
                  </label>
                  <input
                    id="footer_catalog_title"
                    name="footer_catalog_title"
                    type="text"
                    defaultValue={settings.footer_catalog_title}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="footer_catalog_desc">
                    Описание блока
                  </label>
                  <textarea
                    id="footer_catalog_desc"
                    name="footer_catalog_desc"
                    rows={3}
                    defaultValue={settings.footer_catalog_desc}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
              </div>

              {/* Настройки блока "Контакты" */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Блок "Контакты"</h2>
                
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="footer_contacts_title">
                    Название блока
                  </label>
                  <input
                    id="footer_contacts_title"
                    name="footer_contacts_title"
                    type="text"
                    defaultValue={settings.footer_contacts_title}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Контактная информация (до 8 полей)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 8 }).map((_, index) => (
                      <div key={index}>
                        <input
                          name={`contact_${index}`}
                          type="text"
                          defaultValue={settings.contacts[index]?.value || ''}
                          placeholder={`Контакт ${index + 1}`}
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Настройки блока "Быстрые ссылки" */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Блок "Быстрые ссылки"</h2>
                
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="footer_quick_links_title">
                    Название блока
                  </label>
                  <input
                    id="footer_quick_links_title"
                    name="footer_quick_links_title"
                    type="text"
                    defaultValue={settings.footer_quick_links_title}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Быстрые ссылки (до 8 ссылок)
                  </label>
                  <div className="space-y-4">
                    {Array.from({ length: 8 }).map((_, index) => (
                      <div key={index} className="flex space-x-4">
                        <div className="flex-1">
                          <input
                            name={`quick_link_label_${index}`}
                            type="text"
                            defaultValue={settings.quick_links[index]?.label || ''}
                            placeholder={`Текст ссылки ${index + 1}`}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            name={`quick_link_url_${index}`}
                            type="text"
                            defaultValue={settings.quick_links[index]?.url || ''}
                            placeholder={`URL ${index + 1}`}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
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
        </main>
      </div>
    </div>
  );
}