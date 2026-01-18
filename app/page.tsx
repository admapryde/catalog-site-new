import CategoriesGrid from '@/components/CategoriesGrid';
import BannerSlider from '@/components/BannerSlider';
import HomepageSections from '@/components/HomepageSections';
import { CACHE_TTL } from '@/lib/cache-config';

import { cookies, headers } from 'next/headers';

// Асинхронная функция для получения категорий
async function fetchCategories() {
  'use server';

  try {
    // Вместо использования fetch к API маршрутам, напрямую используем Supabase клиент
    const supabase = await import('@/lib/supabase-server').then(mod => mod.createClient());

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Ошибка получения категорий:', error);
    return []; // Возвращаем пустой массив вместо проброса ошибки
  }
}

// Асинхронная функция для получения баннеров
async function fetchBanners() {
  'use server';

  try {
    // Вместо использования fetch к API маршрутам, напрямую используем Supabase клиент
    const supabase = await import('@/lib/supabase-server').then(mod => mod.createClient());

    const { data, error } = await supabase
      .from('banners')
      .select(`
        *,
        banner_groups (*)
      `)
      .order('sort_order', { ascending: true });

    if (error) {
      throw error;
    }

    // Группировка баннеров по группам
    const bannerGroups = data.reduce((groups: any[], banner: any) => {
      const existingGroup = groups.find(group => group.id === banner.group_id);

      if (existingGroup) {
        existingGroup.banners.push(banner);
      } else {
        groups.push({
          id: banner.group_id,
          title: banner.banner_groups?.title || `Группа ${banner.group_id}`,
          position: banner.banner_groups?.position || 0,
          banners: [banner]
        });
      }

      return groups;
    }, []);

    return bannerGroups;
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
  const [categories, bannerGroups, homepageSections] = await Promise.all([
    fetchCategories(),
    fetchBanners(),
    fetchHomepageSections()
  ]);

  return (
    <div>
      {/* Сетка категорий */}
      <CategoriesGrid categories={categories || []} />

      {/* Блоки баннеров */}
      {bannerGroups?.map((group: any) => (
        <BannerSlider key={group.id} group={group} />
      ))}

      {/* Разделы ГС */}
      <HomepageSections sections={homepageSections || []} />
    </div>
  );
}