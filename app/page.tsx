import { Metadata } from "next";
import CategoriesGrid from '@/components/CategoriesGrid';
import BannerSlider from '@/components/BannerSlider';
import HomepageSections from '@/components/HomepageSections';
import { createClient } from '@/lib/supabase-server';

// Асинхронная функция для получения общих настроек
async function getGeneralSettings() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('general_settings')
      .select('*')
      .limit(1);  // Берем только первую запись

    if (error) {
      // Проверяем, является ли ошибка связанной с отсутствием таблицы
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('Таблица general_settings не существует, используем значения по умолчанию');
        return {
          site_title: 'Каталог',
          site_icon: '/favicon.png',
          site_footer_info: '© 2026 Каталог. Все права защищены.',
          bg_image: '', // Добавляем новое поле
        };
      }

      console.error('Ошибка получения общих настроек:', error.message || error);
      // Возвращаем значения по умолчанию
      return {
        site_title: 'Каталог',
        site_icon: '/favicon.ico',
        site_footer_info: '© 2026 Каталог. Все права защищены.',
        bg_image: '', // Добавляем новое поле
      };
    }

    if (!data || data.length === 0) {
      // Если нет ни одной записи, возвращаем значения по умолчанию
      return {
        site_title: 'Каталог',
        site_icon: '/favicon.ico',
        site_footer_info: '© 2026 Каталог. Все права защищены.',
        bg_image: '', // Добавляем новое поле
      };
    }

    // Возвращаем полученные настройки, заполняя недостающие значения по умолчанию
    const settings = data[0];
    return {
      site_title: settings.site_title || 'Каталог',
      site_icon: settings.site_icon || '/favicon.ico',
      site_footer_info: settings.site_footer_info || '© 2026 Каталог. Все права защищены.',
      bg_image: settings.bg_image !== undefined ? settings.bg_image : '', // Добавляем новое поле
    };
  } catch (error: any) {
    // Проверяем, является ли ошибка связанной с отсутствием таблицы
    if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
      console.warn('Таблица general_settings не существует, используем значения по умолчанию');
      return {
        site_title: 'Каталог',
        site_icon: '/favicon.ico',
        site_footer_info: '© 2026 Каталог. Все права защищены.',
      };
    }

    console.error('Ошибка получения общих настроек:', error);
    // Возвращаем значения по умолчанию в случае любой ошибки
    return {
      site_title: 'Каталог',
      site_icon: '/favicon.ico',
      site_footer_info: '© 2026 Каталог. Все права защищены.',
      bg_image: '', // Добавляем новое поле
    };
  }
}

import { CACHE_TTL } from '@/lib/cache-config';
import { cookies, headers } from 'next/headers';
import HomePageWithModal from '@/components/HomePageWithModal';

// Асинхронная функция для получения категорий и заголовка сетки категорий
async function fetchCategories() {
  'use server';

  try {
    // Вместо использования fetch к API маршрутам, напрямую используем Supabase клиент
    const supabase = await import('@/lib/supabase-server').then(mod => mod.createClient());

    // Получаем категории
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (categoriesError) {
      throw categoriesError;
    }

    // Получаем заголовок для сетки категорий из homepage_sections
    const { data: section, error: sectionError } = await supabase
      .from('homepage_sections')
      .select('title')
      .eq('section_type', 'categories_grid')
      .single(); // Ожидаем одну запись

    let categoriesTitle = 'Категории'; // Значение по умолчанию

    if (sectionError) {
      // Если запись не найдена или произошла другая ошибка, используем значение по умолчанию
      if (sectionError.code !== 'PGRST116') { // PGRST116 означает, что запись не найдена
        console.error('Ошибка получения заголовка сетки категорий:', sectionError);
      }
    } else if (section) {
      categoriesTitle = section.title;
    }

    return {
      categories: categories || [],
      title: categoriesTitle
    };
  } catch (error) {
    console.error('Ошибка получения категорий:', error);
    return {
      categories: [], // Возвращаем пустой массив вместо проброса ошибки
      title: 'Категории'
    }; // Возвращаем значение по умолчанию
  }
}

// Асинхронная функция для получения баннеров
async function fetchBanners() {
  'use server';

  try {
    const supabase = await import('@/lib/supabase-server').then(mod => mod.createClient());

    const { data, error } = await supabase
      .from('banner_groups')
      .select(`
        *,
        banners(*)
      `)
      .order('position', { ascending: true }) // сортировка групп
      .order('sort_order', { foreignTable: 'banners', ascending: true }); // сортировка баннеров внутри групп

    if (error) {
      throw error;
    }

    // Возвращаем данные в том же формате, что и API маршрут
    return data;
  } catch (error) {
    console.error('Ошибка получения баннеров:', error);
    return []; // Возвращаем пустой массив вместо проброса ошибки
  }
}

// Асинхронная функция для получения разделов ГС
async function fetchHomepageSections() {
  'use server';

  try {
    // Вместо использования fetch к API маршрутам, напрямую используем Supabase клиент
    const supabase = await import('@/lib/supabase-server').then(mod => mod.createClient());

    const { data: sections, error: sectionsError } = await supabase
      .from('homepage_sections')
      .select(`
        *,
        homepage_section_items (
          *,
          products (
            *,
            product_images (*)
          )
        )
      `)
      .order('position', { ascending: true });

    if (sectionsError) {
      throw sectionsError;
    }

    // Обработка данных для структурирования
    const processedSections = sections.map((section: any) => ({
      ...section,
      items: section.homepage_section_items?.map((item: any) => ({
        ...item,
        product: {
          ...item.products,
          images: item.products?.product_images || []
        }
      })).filter((item: any) => item.product) || []
    }));

    return processedSections;
  } catch (error) {
    console.error('Ошибка получения разделов ГС:', error);
    return []; // Возвращаем пустой массив вместо проброса ошибки
  }
}

export default async function HomePage() {
  // Выполняем параллельные запросы
  const [categoriesData, bannerGroups, homepageSections] = await Promise.all([
    fetchCategories(),
    fetchBanners(),
    fetchHomepageSections()
  ]);

  const { categories = [], title: categoriesTitle = 'Категории' } = categoriesData;

  return (
    <HomePageWithModal>
      <div className="py-8 pt-24 md:pt-8"> {/* Убран bg-white/90, чтобы использовать фон из LayoutWrapper */}
        <div className="container mx-auto px-4"> {/* Ограничиваем ширину контента для согласованности с другими страницами */}
          {/* Сетка категорий */}
          <CategoriesGrid categories={categories} title={categoriesTitle} />

          {/* Блоки баннеров */}
          {bannerGroups?.map((group: any) => (
            <BannerSlider key={group.id} group={{
              id: group.id,
              title: group.title,
              position: group.position,
              banners: group.banners || []
            }} />
          ))}

          {/* Разделы ГС */}
          <HomepageSections sections={homepageSections || []} />
        </div>
      </div>
    </HomePageWithModal>
  );
}