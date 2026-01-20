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
  );
}