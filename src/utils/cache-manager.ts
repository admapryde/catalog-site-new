// Управление кэшем для API-запросов

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();

  /**
   * Получить значение из кэша
   * @param key Ключ кэша
   * @param ttl Время жизни кэша в миллисекундах
   * @returns Значение из кэша или null, если кэш устарел или не существует
   */
  get<T>(key: string, ttl: number): T | null {
    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    // Проверяем, не истекло ли время жизни кэша
    if (Date.now() - cached.timestamp > ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Установить значение в кэш
   * @param key Ключ кэша
   * @param data Данные для кэширования
   */
  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Удалить значение из кэша
   * @param key Ключ кэша
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Очистить весь кэш
   */
  clear(): void {
    this.cache.clear();
  }
}

// Экспортируем глобальный экземпляр кэш-менеджера
export const cacheManager = new CacheManager();