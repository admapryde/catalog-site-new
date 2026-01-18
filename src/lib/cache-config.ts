/**
 * Конфигурация кэширования для приложения
 */

// Время жизни кэша в секундах
export const CACHE_TTL = {
  CATEGORIES: 300, // 5 минут
  PRODUCTS: 300,   // 5 минут
  BANNERS: 300,    // 5 минут
  SEARCH_RESULTS: 180, // 3 минуты
  HOMEPAGE_SECTIONS: 600, // 10 минут
};

// Заголовки кэширования для API маршрутов
export const CACHE_HEADERS = {
  PUBLIC_SHORT: 'public, s-maxage=60, stale-while-revalidate=30', // 1 минута
  PUBLIC_MEDIUM: 'public, s-maxage=300, stale-while-revalidate=60', // 5 минут
  PUBLIC_LONG: 'public, s-maxage=1800, stale-while-revalidate=300', // 30 минут
};

// Кэш в памяти для быстрого доступа к часто запрашиваемым данным
export class InMemoryCache<T = any> {
  private cache: Map<string, { data: T; timestamp: number; ttl: number }> = new Map();

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    // Проверяем, не истекло ли время жизни
    if (Date.now() - entry.timestamp > entry.ttl * 1000) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: T, ttl: number = CACHE_TTL.PRODUCTS): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Метод для получения размера кэша
  size(): number {
    return this.cache.size;
  }

  // Метод для получения всех ключей
  keys(): string[] {
    return Array.from(this.cache.keys());
  }
}

// Кэш с ограничением по размеру (LRU Cache)
export class LRUCache<T = any> {
  private cache: Map<string, T>;
  private capacity: number;

  constructor(capacity: number = 100) {
    this.cache = new Map();
    this.capacity = capacity;
  }

  get(key: string): T | undefined {
    if (!this.cache.has(key)) {
      return undefined;
    }

    const value = this.cache.get(key)!;
    // Перемещаем элемент в конец (как недавно использованный)
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: string, value: T): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // Удаляем первый элемент (наименее недавно использованный)
      const firstKeyIterator = this.cache.keys().next();
      if (!firstKeyIterator.done) {
        this.cache.delete(firstKeyIterator.value);
      }
    }
    this.cache.set(key, value);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Версия кэша - при изменении этой строки все закэшированные данные будут сброшены
const CACHE_VERSION = 'v3'; // Увеличьте версию при изменении структуры данных

// Глобальный экземпляр кэша
export const globalCache = new InMemoryCache();

// LRU кэш для часто запрашиваемых данных
export const lruCache = new LRUCache();