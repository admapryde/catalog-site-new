// Типы для блоков главной страницы
export interface HomepageBlock {
  id: string;
  type: string;
  position: number;
  settings: Record<string, any>; // JSON-объект с настройками
  visible: boolean;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Тип для структуры главной страницы (только блоки, без макетов)
export interface HomepageStructure {
  blocks: HomepageBlock[];
}

// Кэш для структуры главной страницы (работает как на клиенте, так и на сервере)
let homepageStructureCache: { data: HomepageStructure; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 минут в миллисекундах

/**
 * Получает структуру главной страницы (только блоки)
 */
export async function getHomepageStructure(): Promise<HomepageStructure> {
  // Проверяем, есть ли свежие данные в кэше
  if (homepageStructureCache && Date.now() - homepageStructureCache.timestamp < CACHE_DURATION) {
    console.log('Возвращаем структуру главной страницы из кэша');
    return homepageStructureCache.data;
  }

  try {
    // Используем публичный API маршрут для получения структуры главной страницы
    const response = await fetch('/api/homepage-structure', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Отключаем кэширование на уровне fetch, чтобы использовать наше кэширование
      cache: 'no-cache',
    });

    if (!response.ok) {
      throw new Error(`Ошибка получения структуры главной страницы: ${response.status} ${response.statusText}`);
    }

    const data: HomepageStructure = await response.json();

    // Сохраняем результат в кэш
    homepageStructureCache = { data, timestamp: Date.now() };

    console.log('Структура главной страницы успешно получена и закэширована');
    return data;
  } catch (error: any) {
    console.error('Ошибка получения структуры главной страницы:', error);

    // Возвращаем пустую структуру в случае ошибки
    const defaultStructure: HomepageStructure = {
      blocks: []
    };

    // Сохраняем в кэш на случай, если ошибка постоянная
    homepageStructureCache = { data: defaultStructure, timestamp: Date.now() };
    return defaultStructure;
  }
}

/**
 * Получает все блоки главной страницы
 */
export async function getAllHomepageBlocks(): Promise<HomepageBlock[]> {
  try {
    const response = await fetch('/api/admin/homepage-blocks', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-cache',
    });

    if (!response.ok) {
      throw new Error(`Ошибка получения блоков главной страницы: ${response.status} ${response.statusText}`);
    }

    const data: HomepageBlock[] = await response.json();
    return data || [];
  } catch (error: any) {
    console.error('Ошибка получения блоков главной страницы:', error);
    return [];
  }
}

/**
 * Инвалидирует кэш структуры главной страницы
 */
export function invalidateHomepageStructureCache(): void {
  homepageStructureCache = null;
  console.log('Кэш структуры главной страницы инвалидирован');
}

/**
 * Создает новый блок главной страницы
 */
export async function createHomepageBlock(blockData: Omit<HomepageBlock, 'id' | 'created_at' | 'updated_at'>): Promise<HomepageBlock | null> {
  try {
    const response = await fetch('/api/admin/homepage-blocks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(blockData),
    });

    if (!response.ok) {
      throw new Error(`Ошибка создания блока главной страницы: ${response.status} ${response.statusText}`);
    }

    const data: HomepageBlock[] = await response.json();

    // Инвалидируем кэш, так как изменилась структура
    invalidateHomepageStructureCache();

    return data[0] || null;
  } catch (error: any) {
    console.error('Ошибка создания блока главной страницы:', error);
    return null;
  }
}

/**
 * Обновляет блок главной страницы
 */
export async function updateHomepageBlock(id: string, blockData: Partial<Omit<HomepageBlock, 'id' | 'created_at' | 'updated_at'>>): Promise<HomepageBlock | null> {
  try {
    const response = await fetch('/api/admin/homepage-blocks', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, ...blockData }),
    });

    if (!response.ok) {
      throw new Error(`Ошибка обновления блока главной страницы: ${response.status} ${response.statusText}`);
    }

    const data: HomepageBlock[] = await response.json();

    // Инвалидируем кэш, так как изменилась структура
    invalidateHomepageStructureCache();

    return data[0] || null;
  } catch (error: any) {
    console.error('Ошибка обновления блока главной страницы:', error);
    return null;
  }
}

/**
 * Удаляет блок главной страницы
 */
export async function deleteHomepageBlock(id: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/admin/homepage-blocks?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Ошибка удаления блока главной страницы: ${response.status} ${response.statusText}`);
    }

    // Инвалидируем кэш, так как изменилась структура
    invalidateHomepageStructureCache();

    return true;
  } catch (error: any) {
    console.error('Ошибка удаления блока главной страницы:', error);
    return false;
  }
}