'use client';

import { useState, useEffect, useCallback } from 'react';
import { FilterState } from '@/types';

export const useFilterState = (categoryId?: string) => {
  const [filters, setFilters] = useState<FilterState>(() => {
    // Попробуем восстановить фильтры из localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('productFilters');
      if (saved) {
        const parsed = JSON.parse(saved);

        // Если категория не указана (страница /catalog), используем сохраненную категорию
        // Если категория указана (страница /catalog/:id), используем её
        if (!categoryId) {
          return parsed;
        } else {
          // Если категория изменилась, сбросим фильтры характеристик
          if (parsed.category_id !== categoryId) {
            return {
              category_id: categoryId,
              price_from: parsed.price_from,
              price_to: parsed.price_to,
              spec_filters: {}
            };
          }
          return parsed;
        }
      }
    }

    return {
      category_id: categoryId,
      price_from: undefined,
      price_to: undefined,
      spec_filters: {}
    };
  });

  // Сохраняем фильтры в localStorage при их изменении
  useEffect(() => {
    localStorage.setItem('productFilters', JSON.stringify(filters));
  }, [filters]);

  const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  }, []);

  const resetFilters = useCallback(() => {
    const resetFilters: FilterState = {
      category_id: categoryId,
      price_from: undefined,
      price_to: undefined,
      spec_filters: {}
    };
    setFilters(resetFilters);
  }, [categoryId]);

  return { filters, updateFilters, resetFilters };
};