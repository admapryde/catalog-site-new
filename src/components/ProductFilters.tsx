'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FilterState, SpecTypeWithValues } from '@/types';
import { debounce } from '@/utils/debounce';

interface ProductFiltersProps {
  initialFilters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  categoryId?: string;
  pathname?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductFilters({
  initialFilters,
  onFilterChange,
  categoryId,
  pathname,
  isOpen,
  onClose
}: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Используем useRef для отслеживания первого рендера и текущей категории
  const isFirstRender = useRef(true);
  const selectedCategoryRef = useRef<string | undefined>(initialFilters.category_id);

  const [priceFrom, setPriceFrom] = useState<string>(initialFilters.price_from?.toString() || '');
  const [priceTo, setPriceTo] = useState<string>(initialFilters.price_to?.toString() || '');
  const [availableSpecs, setAvailableSpecs] = useState<SpecTypeWithValues[]>([]);
  const [selectedSpecFilters, setSelectedSpecFilters] = useState<Record<string, string[]>>(initialFilters.spec_filters || {});
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  // Состояние для диапазонных фильтров
  const [rangeFilters, setRangeFilters] = useState<Record<string, { min: string; max: string }>>({});

  // Создаем debounced версию onFilterChange
  const debouncedOnFilterChange = useCallback(
    debounce((filters: FilterState) => {
      onFilterChange(filters);
    }, 300),
    [onFilterChange]
  );

  // Загружаем категории, если мы на странице /catalog (без categoryId)
  useEffect(() => {
    if (!categoryId) {
      const fetchCategories = async () => {
        try {
          const response = await fetch('/api/categories');
          if (!response.ok) {
            throw new Error('Не удалось загрузить категории');
          }
          const data = await response.json();
          setCategories(data);
        } catch (error) {
          console.error('Ошибка загрузки категорий:', error);
        }
      };

      fetchCategories();
    }
  }, [categoryId]);

  // Восстанавливаем фильтры при изменении initialFilters, но только при смене категории
  useEffect(() => {
    // Обновляем состояние фильтров при изменении initialFilters
    // Только если это первая загрузка или сменилась категория
    if (isFirstRender.current || initialFilters.category_id !== selectedCategoryRef.current) {
      setPriceFrom(initialFilters.price_from?.toString() || '');
      setPriceTo(initialFilters.price_to?.toString() || '');

      // Для spec_filters нужно обновить как selectedSpecFilters, так и rangeFilters
      const newSelectedSpecFilters: Record<string, string[]> = {};
      const newRangeFilters: Record<string, { min: string; max: string }> = {};

      if (initialFilters.spec_filters) {
        Object.entries(initialFilters.spec_filters).forEach(([key, values]) => {
          // Проверяем, является ли это диапазонным фильтром
          const isRangeFilter = values.some(v => v.startsWith('min:') || v.startsWith('max:'));

          if (isRangeFilter) {
            let minVal = '';
            let maxVal = '';

            values.forEach(v => {
              if (v.startsWith('min:')) {
                minVal = v.substring(4);
              } else if (v.startsWith('max:')) {
                maxVal = v.substring(4);
              }
            });

            newRangeFilters[key] = { min: minVal, max: maxVal };
          } else {
            newSelectedSpecFilters[key] = [...values];
          }
        });
      }

      setSelectedSpecFilters(newSelectedSpecFilters);
      setRangeFilters(newRangeFilters);

      // Обновляем значение категории для отслеживания
      selectedCategoryRef.current = initialFilters.category_id;
      isFirstRender.current = false;
    }
  }, [initialFilters, initialFilters.category_id]);

  // Загружаем доступные характеристики при изменении категории
  useEffect(() => {
    const fetchSpecValues = async () => {
      // Используем либо categoryId из пропсов, либо из фильтров (если пользователь выбрал категорию в фильтрах)
      const effectiveCategoryId = categoryId || initialFilters.category_id;
      if (!effectiveCategoryId) {
        // Если нет категории, очищаем доступные характеристики
        setAvailableSpecs([]);
        return;
      }

      try {
        const response = await fetch(`/api/spec-values?category_id=${effectiveCategoryId}`);
        if (!response.ok) {
          console.error(`Ошибка загрузки значений характеристик: ${response.status} ${response.statusText}`);
          // Даже при ошибке очищаем доступные характеристики
          setAvailableSpecs([]);
          return;
        }

        const specs: SpecTypeWithValues[] = await response.json();
        setAvailableSpecs(specs);

        // При загрузке новых характеристик, сбрасываем фильтры для тех, что больше не доступны
        setSelectedSpecFilters(prev => {
          const newFilters: Record<string, string[]> = {};
          specs.forEach(spec => {
            if (prev[spec.property_name]) {
              newFilters[spec.property_name] = prev[spec.property_name];
            }
          });
          return newFilters;
        });

        setRangeFilters(prev => {
          const newFilters: Record<string, { min: string; max: string }> = {};
          specs.forEach(spec => {
            if (spec.spec_type === 'RANGE' && prev[spec.property_name]) {
              newFilters[spec.property_name] = prev[spec.property_name];
            }
          });
          return newFilters;
        });
      } catch (error) {
        console.error('Ошибка загрузки значений характеристик:', error);
        setAvailableSpecs([]);
      }
    };

    fetchSpecValues();
  }, [categoryId, initialFilters.category_id]);

  // Обновляем фильтры при изменении состояния
  useEffect(() => {
    // Объединяем обычные фильтры и диапазонные фильтры
    const combinedSpecFilters = { ...selectedSpecFilters };

    // Добавляем диапазонные фильтры
    Object.entries(rangeFilters).forEach(([key, range]) => {
      if (range.min || range.max) {
        combinedSpecFilters[key] = [];
        if (range.min) combinedSpecFilters[key].push(`min:${range.min}`);
        if (range.max) combinedSpecFilters[key].push(`max:${range.max}`);
      }
    });

    // Преобразуем строки в числа с проверкой на корректность
    let processedPriceFrom: number | undefined;
    let processedPriceTo: number | undefined;

    if (priceFrom) {
      const numValue = Number(priceFrom);
      if (!isNaN(numValue) && isFinite(numValue) && numValue >= 0) {
        processedPriceFrom = numValue;
      }
    }

    if (priceTo) {
      const numValue = Number(priceTo);
      if (!isNaN(numValue) && isFinite(numValue) && numValue >= 0) {
        processedPriceTo = numValue;
      }
    }

    // Проверяем, чтобы "цена от" не была больше "цены до"
    if (processedPriceFrom !== undefined && processedPriceTo !== undefined && processedPriceFrom > processedPriceTo) {
      // Меняем местами значения, если "цена от" больше "цены до"
      const temp = processedPriceFrom;
      processedPriceFrom = processedPriceTo;
      processedPriceTo = temp;
    }

    const filters: FilterState = {
      category_id: initialFilters.category_id,
      price_from: processedPriceFrom,
      price_to: processedPriceTo,
      spec_filters: combinedSpecFilters
    };

    debouncedOnFilterChange(filters);
  }, [priceFrom, priceTo, selectedSpecFilters, rangeFilters, initialFilters.category_id, debouncedOnFilterChange]);

  const handleSpecFilterChange = useCallback((propertyName: string, value: string, checked: boolean) => {
    setSelectedSpecFilters(prev => {
      const currentValues = prev[propertyName] || [];
      let newValues: string[];

      if (checked) {
        newValues = [...currentValues, value];
      } else {
        newValues = currentValues.filter(v => v !== value);
      }

      return {
        ...prev,
        [propertyName]: newValues
      };
    });
  }, []);

  const handleRangeFilterChange = useCallback((propertyName: string, minOrMax: 'min' | 'max', value: string) => {
    setRangeFilters(prev => ({
      ...prev,
      [propertyName]: {
        ...prev[propertyName],
        [minOrMax]: value
      }
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setPriceFrom('');
    setPriceTo('');
    setSelectedSpecFilters({});
    setRangeFilters({});

    // Если мы на странице /catalog (без конкретной категории), то при сбросе фильтров
    // также сбрасываем выбранную категорию в "Все категории" (undefined)
    // В противном случае (на странице конкретной категории) сохраняем текущую категорию
    const newFilters = {
      category_id: !categoryId ? undefined : initialFilters.category_id,
      price_from: undefined,
      price_to: undefined,
      spec_filters: {}
    };

    // Сбрасываем ref категории при очистке фильтров
    selectedCategoryRef.current = newFilters.category_id;

    onFilterChange(newFilters);
  }, [categoryId, initialFilters.category_id, onFilterChange]);

  // Определяем, есть ли активные фильтры
  const hasActiveFilters = useMemo(() => {
    return priceFrom !== '' ||
      priceTo !== '' ||
      Object.keys(selectedSpecFilters).some(key => selectedSpecFilters[key].length > 0) ||
      Object.keys(rangeFilters).some(key => rangeFilters[key].min !== '' || rangeFilters[key].max !== '');
  }, [priceFrom, priceTo, selectedSpecFilters, rangeFilters]);

  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-6 h-full flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Фильтры</h3>
          <button
            onClick={onClose}
            className="text-gray-700 hover:text-gray-900"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-grow">
          {/* Категория (только на странице /catalog) */}
          {!categoryId && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Категория</h4>
              <select
                value={initialFilters.category_id || ''}
                onChange={(e) => {
                  const selectedCategoryId = e.target.value || undefined;

                  // При выборе категории из списка, восстанавливаем сохраненные фильтры для этой категории
                  const savedFiltersStr = localStorage.getItem('productFilters');
                  let restoredFilters = { spec_filters: {}, price_from: undefined, price_to: undefined };

                  if (savedFiltersStr) {
                    try {
                      const savedFilters = JSON.parse(savedFiltersStr);

                      // Если у нас есть сохраненные фильтры для выбранной категории
                      if (selectedCategoryId && savedFilters[selectedCategoryId]) {
                        restoredFilters = savedFilters[selectedCategoryId];
                      } else if (selectedCategoryId) {
                        // Если фильтров для этой категории нет, используем общие фильтры
                        // (для совместимости с предыдущей версией хранения)
                        restoredFilters = {
                          spec_filters: savedFilters.general?.spec_filters || {},
                          price_from: savedFilters.general?.price_from,
                          price_to: savedFilters.general?.price_to
                        };
                      }
                    } catch (error) {
                      console.error('Ошибка при разборе сохраненных фильтров:', error);
                    }
                  }

                  // Обновляем ref категории при выборе новой категории
                  selectedCategoryRef.current = selectedCategoryId;

                  onFilterChange({
                    category_id: selectedCategoryId,
                    ...restoredFilters
                  });
                }}
                className="w-full p-2 border border-gray-400 rounded focus:ring-0 focus:border-gray-500 text-gray-900"
              >
                <option value="">Все категории</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Цена (на всех страницах) */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Цена</h4>
            <div className="space-y-3">
              <input
                type="number"
                placeholder="От"
                value={priceFrom}
                onChange={(e) => setPriceFrom(e.target.value)}
                className="w-full p-2 border border-gray-400 rounded focus:ring-0 focus:border-gray-500 text-gray-900"
              />
              <input
                type="number"
                placeholder="До"
                value={priceTo}
                onChange={(e) => setPriceTo(e.target.value)}
                className="w-full p-2 border border-gray-400 rounded focus:ring-0 focus:border-gray-500 text-gray-900"
              />
            </div>
          </div>

          {/* Характеристики (показываем, если выбрана категория, даже на странице /catalog) */}
          {(categoryId || initialFilters.category_id) && availableSpecs.map(spec => (
            <div key={spec.property_name} className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">{spec.property_name}</h4>
              {spec.spec_type === 'CHECKBOXES' && (
                <div className="space-y-2">
                  {spec.available_values.map(value => (
                    <label key={`${spec.property_name}-${value}`} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedSpecFilters[spec.property_name]?.includes(value) || false}
                        onChange={(e) => handleSpecFilterChange(spec.property_name, value, e.target.checked)}
                        className="rounded text-blue-600 focus:ring-0 focus:ring-offset-0"
                      />
                      <span className="text-gray-800">{value}</span>
                    </label>
                  ))}
                </div>
              )}
              {spec.spec_type === 'RADIO' && (
                <div className="space-y-2">
                  {spec.available_values.map(value => (
                    <label key={`${spec.property_name}-${value}`} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name={spec.property_name}
                        checked={selectedSpecFilters[spec.property_name]?.includes(value) || false}
                        onChange={(e) => {
                          // Для радио-кнопок удаляем все предыдущие значения и добавляем новое
                          setSelectedSpecFilters(prev => ({
                            ...prev,
                            [spec.property_name]: e.target.checked ? [value] : []
                          }));
                        }}
                        className="text-blue-600 focus:ring-0 focus:ring-offset-0"
                      />
                      <span className="text-gray-800">{value}</span>
                    </label>
                  ))}
                </div>
              )}
              {spec.spec_type === 'SELECT' && (
                <select
                  value={selectedSpecFilters[spec.property_name]?.[0] || ''}
                  onChange={(e) => {
                    // Для выпадающего списка удаляем все предыдущие значения и добавляем новое
                    setSelectedSpecFilters(prev => ({
                      ...prev,
                      [spec.property_name]: e.target.value ? [e.target.value] : []
                    }));
                  }}
                  className="w-full p-2 border border-gray-400 rounded focus:ring-0 focus:border-gray-500 text-gray-900"
                >
                  <option value="" className="text-gray-400">Выберите {spec.property_name.toLowerCase()}</option>
                  {spec.available_values.map(value => (
                    <option key={`${spec.property_name}-${value}`} value={value} className="text-gray-900">
                      {value}
                    </option>
                  ))}
                </select>
              )}
              {spec.spec_type === 'RANGE' && (
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="От"
                      value={rangeFilters[spec.property_name]?.min || ''}
                      onChange={(e) => handleRangeFilterChange(spec.property_name, 'min', e.target.value)}
                      className="w-full p-2 border border-gray-400 rounded focus:ring-0 focus:border-gray-500 text-gray-900"
                    />
                    <input
                      type="number"
                      placeholder="До"
                      value={rangeFilters[spec.property_name]?.max || ''}
                      onChange={(e) => handleRangeFilterChange(spec.property_name, 'max', e.target.value)}
                      className="w-full p-2 border border-gray-400 rounded focus:ring-0 focus:border-gray-500 text-gray-900"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-auto pt-4 border-t border-gray-300">
          <button
            onClick={clearFilters}
            className="w-full py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700 mb-3 focus:outline-none focus:ring-0"
          >
            Сбросить фильтры
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-0"
          >
            Применить фильтры
          </button>
        </div>
      </div>
    </div>
  );
}