import CategoriesGrid from '@/components/CategoriesGrid';
import BannerSlider from '@/components/BannerSlider';
import HomepageSections from '@/components/HomepageSections';
import { CACHE_TTL } from '@/lib/cache-config';

// Асинхронная функция для получения категорий
async function fetchCategories() {
  'use server';

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/categories`, {
      next: {
        tags: ['homepage_categories'],
        revalidate: CACHE_TTL.CATEGORIES // Устанавливаем время кэширования
      } // Используем теги кэширования
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error('Ошибка получения категорий:', error);
    throw error; // Пробрасываем ошибку дальше
  }
}

// Асинхронная функция для получения баннеров
async function fetchBanners() {
  'use server';

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/banners`, {
      next: {
        tags: ['homepage_banners'],
        revalidate: CACHE_TTL.BANNERS // Устанавливаем время кэширования
      } // Используем теги кэширования
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error('Ошибка получения баннеров:', error);
    throw error; // Пробрасываем ошибку дальше
  }
}

// Асинхронная функция для получения разделов ГС
async function fetchHomepageSections() {
  'use server';

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/homepage-sections`, {
      next: {
        tags: ['homepage_sections'],
        revalidate: CACHE_TTL.HOMEPAGE_SECTIONS // Устанавливаем время кэширования
      } // Используем теги кэширования
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error('Ошибка получения разделов ГС:', error);
    throw error; // Пробрасываем ошибку дальше
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
      {bannerGroups?.map(group => (
        <BannerSlider key={group.id} group={group} />
      ))}

      {/* Разделы ГС */}
      <HomepageSections sections={homepageSections || []} />
    </div>
  );
}