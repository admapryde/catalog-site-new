'use client';

import { useState, useEffect, useCallback } from 'react';
import { FilterState } from '@/types';

export interface SavedFilters {
  [categoryId: string]: Omit<FilterState, 'category_id'>;
}

// Создаем отдельное состояние для каждого контекста (с категорией и без)
const filterStatesMap = new Map<string, FilterState>();

export const useFilterState = (categoryId?: string) => {
  // Определяем уникальный ключ для данного контекста
  const contextKey = categoryId ? `category_${categoryId}` : 'general';

  // Инициализируем состояние для этого контекста, если оно еще не создано
  if (!filterStatesMap.has(contextKey)) {
    // Попробуем восстановить фильтры из localStorage
    let initialFilters: FilterState;

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('productFilters');
      if (saved) {
        const parsed: SavedFilters = JSON.parse(saved);

        if (categoryId) {
          const categoryFilters = parsed[categoryId] || {};
          initialFilters = {
            category_id: categoryId,
            price_from: categoryFilters.price_from,
            price_to: categoryFilters.price_to,
            spec_filters: categoryFilters.spec_filters || {}
          };
        } else {
          const generalFilters = parsed['general'] || {};
          initialFilters = {
            category_id: undefined,
            price_from: generalFilters.price_from,
            price_to: generalFilters.price_to,
            spec_filters: generalFilters.spec_filters || {}
          };
        }
      } else {
        initialFilters = {
          category_id: categoryId,
          price_from: undefined,
          price_to: undefined,
          spec_filters: {}
        };
      }
    } else {
      initialFilters = {
        category_id: categoryId,
        price_from: undefined,
        price_to: undefined,
        spec_filters: {}
      };
    }

    filterStatesMap.set(contextKey, initialFilters);
  }

  // Используем локальный стейт для управления обновлениями в пределах компонента
  const [localFilters, setLocalFilters] = useState<FilterState>(() => filterStatesMap.get(contextKey)!);

  // Обновляем локальный стейт, когда меняется глобальное состояние для этого контекста
  useEffect(() => {
    const updateLocalFilters = () => {
      setLocalFilters(filterStatesMap.get(contextKey)!);
    };

    // Подписываемся на изменения (в реальном приложении можно использовать более сложную систему подписки)
    updateLocalFilters();

    // Возвращаем функцию очистки
    return () => {
      // Здесь можно реализовать дополнительную логику при необходимости
    };
  }, [contextKey]);

  // Функция для обновления фильтров
  const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    const updatedFilters = {
      ...filterStatesMap.get(contextKey)!,
      ...newFilters
    };

    // Обновляем глобальное состояние
    filterStatesMap.set(contextKey, updatedFilters);

    // Обновляем локальное состояние
    setLocalFilters(updatedFilters);

    // Сохраняем в localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('productFilters');
      const savedFilters: SavedFilters = saved ? JSON.parse(saved) : {};

      let updatedSavedFilters: SavedFilters;

      if (categoryId) {
        // Сохраняем фильтры для конкретной категории
        updatedSavedFilters = {
          ...savedFilters,
          [categoryId]: {
            price_from: updatedFilters.price_from,
            price_to: updatedFilters.price_to,
            spec_filters: updatedFilters.spec_filters || {}
          }
        };
      } else {
        // Сохраняем общие фильтры (для использования на странице /catalog)
        updatedSavedFilters = {
          ...savedFilters,
          general: {
            price_from: updatedFilters.price_from,
            price_to: updatedFilters.price_to,
            spec_filters: updatedFilters.spec_filters || {}
          }
        };
      }

      localStorage.setItem('productFilters', JSON.stringify(updatedSavedFilters));
    }
  }, [contextKey, categoryId]);

  // Функция для сброса фильтров
  const resetFilters = useCallback(() => {
    const resetFiltersObj: FilterState = {
      category_id: categoryId,
      price_from: undefined,
      price_to: undefined,
      spec_filters: {}
    };

    // Обновляем глобальное состояние
    filterStatesMap.set(contextKey, resetFiltersObj);

    // Обновляем локальное состояние
    setLocalFilters(resetFiltersObj);

    // Сохраняем в localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('productFilters');
      const savedFilters: SavedFilters = saved ? JSON.parse(saved) : {};

      let updatedSavedFilters: SavedFilters;

      if (categoryId) {
        // Сохраняем фильтры для конкретной категории
        updatedSavedFilters = {
          ...savedFilters,
          [categoryId]: {
            price_from: undefined,
            price_to: undefined,
            spec_filters: {}
          }
        };
      } else {
        // Сохраняем общие фильтры (для использования на странице /catalog)
        updatedSavedFilters = {
          ...savedFilters,
          general: {
            price_from: undefined,
            price_to: undefined,
            spec_filters: {}
          }
        };
      }

      localStorage.setItem('productFilters', JSON.stringify(updatedSavedFilters));
    }
  }, [contextKey, categoryId]);

  return { filters: localFilters, updateFilters, resetFilters };
};