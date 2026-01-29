// Утилиты для получения данных главной страницы, которые можно использовать как на клиенте, так и на сервере

/**
 * Получает категории для главной страницы
 */
export async function fetchCategoriesForClient() {
  try {
    const response = await fetch('/api/categories', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-cache',
    });

    if (!response.ok) {
      throw new Error(`Ошибка получения категорий: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return { categories: data, title: 'Категории' };
  } catch (error) {
    console.error('Ошибка загрузки категорий:', error);
    return { categories: [], title: 'Категории' };
  }
}

/**
 * Получает баннеры для главной страницы
 */
export async function fetchBannersForClient() {
  try {
    const response = await fetch('/api/banners', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-cache',
    });

    if (!response.ok) {
      throw new Error(`Ошибка получения баннеров: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Ошибка загрузки баннеров:', error);
    return [];
  }
}

/**
 * Получает разделы главной страницы
 */
export async function fetchHomepageSectionsForClient() {
  try {
    const response = await fetch('/api/homepage-sections', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-cache',
    });

    if (!response.ok) {
      throw new Error(`Ошибка получения разделов главной страницы: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Ошибка загрузки разделов главной страницы:', error);
    return [];
  }
}