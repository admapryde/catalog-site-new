'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { FilterState } from '@/types';
import ProductFilters from './ProductFilters';

interface FilterButtonProps {
  initialFilters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  categoryId?: string;
}

// Вспомогательная функция для подсчета активных фильтров
function countActiveFilters(filters: FilterState): number {
  let count = 0;

  // Проверяем ценовые фильтры
  if (filters.price_from !== undefined && filters.price_from > 0) count++;
  if (filters.price_to !== undefined && filters.price_to > 0) count++;

  // Проверяем фильтры по характеристикам
  if (filters.spec_filters) {
    Object.values(filters.spec_filters).forEach(values => {
      if (values.length > 0) {
        count += values.length;
      }
    });
  }

  // Проверяем фильтр по категории (если он отличается от undefined)
  if (filters.category_id) count++;

  return count;
}

export default function FilterButton({
  initialFilters,
  onFilterChange,
  categoryId
}: FilterButtonProps) {
  const pathname = usePathname();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  // Подсчитываем количество активных фильтров
  const activeFiltersCount = countActiveFilters(initialFilters);

  // Устанавливаем флаг, что компонент смонтирован на клиенте
  useEffect(() => {
    setHasMounted(true);
  }, []);

  return (
    <>
      <button
        onClick={() => setIsFiltersOpen(true)}
        className="fixed top-24 left-4 z-40 bg-white px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-shadow flex items-center space-x-2"
        aria-label="Фильтры"
      >
        <span className="text-gray-700 text-sm font-medium">Фильтры</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>

        {/* Индикатор количества активных фильтров - отображаем только на клиенте */}
        {hasMounted && activeFiltersCount > 0 && (
          <div className="absolute bottom-0 right-0 transform translate-x-1/4 translate-y-1/4 bg-gray-200 border border-black rounded-full w-6 h-6 flex items-center justify-center">
            <span className="text-xs font-bold text-black">{activeFiltersCount}</span>
          </div>
        )}
      </button>

      <div
        className={`fixed inset-0 z-40 transition-opacity ${isFiltersOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.25)' }}
        onClick={() => setIsFiltersOpen(false)}
      ></div>

      <ProductFilters
        initialFilters={initialFilters}
        onFilterChange={onFilterChange}
        categoryId={categoryId}
        pathname={pathname}
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
      />
    </>
  );
}