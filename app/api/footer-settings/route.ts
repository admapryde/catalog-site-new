import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createAPIClient } from '@/lib/supabase-server';
import { revalidateTag } from 'next/cache';
import { getAdminSessionFromRequest } from '@/services/admin-auth-service';

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

export async function PUT(request: NextRequest) {
  // Проверяем, что пользователь аутентифицирован как администратор
  const adminUser = await getAdminSessionFromRequest(request);
  if (!adminUser) {
    return Response.json({ error: 'Требуется аутентификация администратора' }, { status: 401 });
  }

  try {
    const {
      footer_catalog_title,
      footer_catalog_desc,
      footer_contacts_title,
      footer_quick_links_title,
      contacts,
      quick_links
    } = await request.json();

    // Try using service role client for admin operations to bypass RLS if needed
    // First, try with the regular client using the request object
    const supabase = await createAPIClient(request);

    // Обновляем общие настройки
    // Сначала удаляем старые общие настройки
    const { error: deleteGeneralError } = await supabase
      .from('footer_settings')
      .delete()
      .eq('setting_type', 'general');

    if (deleteGeneralError) {
      console.error('Ошибка удаления старых общих настроек футера:', deleteGeneralError.message || deleteGeneralError);

      // Если это ошибка доступа, пробуем использовать service role клиента
      if (deleteGeneralError.code === '42501' || deleteGeneralError.message?.includes('permission denied')) {
        console.warn('Обнаружена ошибка доступа, используем service role клиента для общих настроек футера');

        try {
          const serviceRoleClient = createServiceRoleClient();

          const { error: deleteGeneralErrorSR } = await serviceRoleClient
            .from('footer_settings')
            .delete()
            .eq('setting_type', 'general');

          if (deleteGeneralErrorSR) {
            console.error('Ошибка удаления общих настроек футера через service role:', deleteGeneralErrorSR.message || deleteGeneralErrorSR);
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

      // Если это ошибка доступа, пробуем использовать service role клиента
      if (insertGeneralError.code === '42501' || insertGeneralError.message?.includes('permission denied')) {
        console.warn('Обнаружена ошибка доступа, используем service role клиента для общих настроек футера');

        try {
          const serviceRoleClient = createServiceRoleClient();

          const { error: insertGeneralErrorSR } = await serviceRoleClient
            .from('footer_settings')
            .insert(generalSettings);

          if (insertGeneralErrorSR) {
            console.error('Ошибка добавления общих настроек футера через service role:', insertGeneralErrorSR.message || insertGeneralErrorSR);
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

    // Обрабатываем контактные данные
    // Сначала удаляем старые контактные данные
    const { error: deleteContactsError } = await supabase
      .from('footer_settings')
      .delete()
      .eq('setting_type', 'contact');

    if (deleteContactsError) {
      console.error('Ошибка удаления старых контактных данных:', deleteContactsError.message || deleteContactsError);

      // Если это ошибка доступа, пробуем использовать service role клиента
      if (deleteContactsError.code === '42501' || deleteContactsError.message?.includes('permission denied')) {
        console.warn('Обнаружена ошибка доступа, используем service role клиента для контактных данных футера');

        try {
          const serviceRoleClient = createServiceRoleClient();

          const { error: deleteContactsErrorSR } = await serviceRoleClient
            .from('footer_settings')
            .delete()
            .eq('setting_type', 'contact');

          if (deleteContactsErrorSR) {
            console.error('Ошибка удаления контактных данных через service role:', deleteContactsErrorSR.message || deleteContactsErrorSR);
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

    // Добавляем новые контактные данные
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      if (contact.value && contact.value.trim() !== '') {
        const { error: insertContactError } = await supabase
          .from('footer_settings')
          .insert({
            setting_key: `contact_${i}`,
            setting_value: contact.value,
            setting_type: 'contact',
            position: i
          });

        if (insertContactError) {
          console.error('Ошибка добавления контактной информации:', insertContactError.message || insertContactError);

          // Если это ошибка доступа, пробуем использовать service role клиента
          if (insertContactError.code === '42501' || insertContactError.message?.includes('permission denied')) {
            console.warn('Обнаружена ошибка доступа, используем service role клиента для контактных данных футера');

            try {
              const serviceRoleClient = createServiceRoleClient();

              const { error: insertContactErrorSR } = await serviceRoleClient
                .from('footer_settings')
                .insert({
                  setting_key: `contact_${i}`,
                  setting_value: contact.value,
                  setting_type: 'contact',
                  position: i
                });

              if (insertContactErrorSR) {
                console.error('Ошибка добавления контактной информации через service role:', insertContactErrorSR.message || insertContactErrorSR);
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
    }

    // Обрабатываем быстрые ссылки
    // Сначала удаляем старые быстрые ссылки
    const { error: deleteLinksError } = await supabase
      .from('footer_settings')
      .delete()
      .eq('setting_type', 'quick_link');

    if (deleteLinksError) {
      console.error('Ошибка удаления старых быстрых ссылок:', deleteLinksError.message || deleteLinksError);

      // Если это ошибка доступа, пробуем использовать service role клиента
      if (deleteLinksError.code === '42501' || deleteLinksError.message?.includes('permission denied')) {
        console.warn('Обнаружена ошибка доступа, используем service role клиента для быстрых ссылок футера');

        try {
          const serviceRoleClient = createServiceRoleClient();

          const { error: deleteLinksErrorSR } = await serviceRoleClient
            .from('footer_settings')
            .delete()
            .eq('setting_type', 'quick_link');

          if (deleteLinksErrorSR) {
            console.error('Ошибка удаления быстрых ссылок через service role:', deleteLinksErrorSR.message || deleteLinksErrorSR);
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

    // Добавляем новые быстрые ссылки
    for (let i = 0; i < quick_links.length; i++) {
      const link = quick_links[i];

      if (link.label && link.label.trim() !== '' && link.url && link.url.trim() !== '') {
        const linkData = JSON.stringify({ label: link.label, url: link.url });

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

          // Если это ошибка доступа, пробуем использовать service role клиента
          if (insertLinkError.code === '42501' || insertLinkError.message?.includes('permission denied')) {
            console.warn('Обнаружена ошибка доступа, используем service role клиента для быстрых ссылок футера');

            try {
              const serviceRoleClient = createServiceRoleClient();

              const { error: insertLinkErrorSR } = await serviceRoleClient
                .from('footer_settings')
                .insert({
                  setting_key: `quick_link_${i}`,
                  setting_value: linkData,
                  setting_type: 'quick_link',
                  position: i
                });

              if (insertLinkErrorSR) {
                console.error('Ошибка добавления быстрой ссылки через service role:', insertLinkErrorSR.message || insertLinkErrorSR);
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
    }

    // Инвалидируем кэш для настроек футера
    revalidateTag('footer_settings', 'max');

    return Response.json({ success: true });
  } catch (error: any) {
    console.error('Ошибка обновления настроек футера:', error);
    return Response.json({
      error: error.message || 'Ошибка обновления настроек'
    }, { status: 500 });
  }
}