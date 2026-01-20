'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import OptimizedImage from '@/components/OptimizedImage';
import { Product, FilterState } from '@/types';
import { lruCache } from '@/lib/cache-config';
import ProductModal from '@/components/ProductModal';
import FilterButton from '@/components/FilterButton';
import { useFilterState } from '@/hooks/useFilterState';

interface ProductsGridContentProps {
  categoryId?: string;
  search?: string;
}

export default function ProductsGridContent({ categoryId, search }: ProductsGridContentProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null); // Using any temporarily since we need to fetch full product details
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { filters, updateFilters } = useFilterState(categoryId);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setError(null);
        setLoading(true);

        // Формируем URL с параметрами фильтрации
        let apiUrl = `/api/products`;
        const params = new URLSearchParams();

        // Добавляем параметр категории из фильтров, если он указан
        // Если в фильтрах нет категории, используем categoryId из URL
        if (filters.category_id) {
          params.append('category_id', encodeURIComponent(filters.category_id));
        } else if (categoryId) {
          params.append('category_id', encodeURIComponent(categoryId));
        }

        // Добавляем параметры фильтрации
        if (filters.price_from) {
          params.append('price_from', filters.price_from.toString());
        }
        if (filters.price_to) {
          params.append('price_to', filters.price_to.toString());
        }

        // Добавляем фильтры по характеристикам
        Object.entries(filters.spec_filters).forEach(([specTypeId, values]) => {
          if (values.length > 0) {
            params.append(`spec_${specTypeId}`, values.join(','));
          }
        });

        // Добавляем параметр поиска, если он передан
        if (search) {
          params.append('search', encodeURIComponent(search));
        }

        if (params.toString()) {
          apiUrl += `?${params.toString()}`;
        }

        // Проверяем кэш
        const cacheKey = `products_${apiUrl}`;
        const cached = lruCache.get(cacheKey) as Product[] | null;

        // Используем кэшированные данные, если они есть
        if (cached) {
          setProducts(cached);
          setLoading(false);
          return;
        }

        // Используем fetch с контролем времени ожидания
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 секунд таймаут

        const response = await fetch(apiUrl, {
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Ошибка загрузки товаров: ${response.status} ${response.statusText}`);
        }

        // Явно преобразуем response в JSON через Promise
        const data = await response.json().catch(error => {
          console.error('Ошибка парсинга JSON:', error);
          throw new Error('Неверный формат данных от сервера');
        });

        setProducts(data);

        // Сохраняем в кэш
        lruCache.set(cacheKey, data);
      } catch (err: any) {
        if (err.name === 'AbortError') {
          setError('Время ожидания запроса истекло');
        } else if (err instanceof TypeError && err.message.includes('fetch')) {
          // Обработка ошибки сети
          setError('Ошибка подключения к серверу. Проверьте интернет соединение.');
        } else {
          setError(err.message);
        }
        console.error('Ошибка загрузки товаров:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryId,
      search,
      filters.category_id,
      filters.price_from,
      filters.price_to,
      JSON.stringify(filters.spec_filters)]);

  const handleProductClick = async (productId: string) => {
    try {
      // Fetch full product details for the modal
      const response = await fetch(`/api/products/${productId}`);

      if (!response.ok) {
        throw new Error(`Ошибка загрузки деталей товара: ${response.status} ${response.statusText}`);
      }

      const productDetail = await response.json();
      setSelectedProduct(productDetail);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Ошибка загрузки деталей товара:', error);
      // Fallback to navigation if API fails
      window.location.href = `/product/${productId}`;
    }
  };

  if (loading) {
    return (
      <div className="relative">
        <FilterButton
          initialFilters={filters}
          onFilterChange={updateFilters}
          categoryId={categoryId}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
              <div className="relative pb-[100%] bg-gray-200"></div>
              <div className="p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative">
        <FilterButton
          initialFilters={filters}
          onFilterChange={updateFilters}
          categoryId={categoryId}
        />
        <div className="text-center py-8">
          <p className="text-red-600">Ошибка загрузки товаров: {error}</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="relative">
        <FilterButton
          initialFilters={filters}
          onFilterChange={updateFilters}
          categoryId={categoryId}
        />
        <div className="text-center py-8">
          <p className="text-gray-500">По заданным фильтрам товаров не найдено</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <FilterButton
        initialFilters={filters}
        onFilterChange={updateFilters}
        categoryId={categoryId}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => {
          const mainImage = product.images && Array.isArray(product.images)
            ? (product.images.find(img => img.is_main) || product.images[0])
            : null;

          return (
            <div
              key={product.id}
              onClick={() => handleProductClick(product.id)}
              className="block group bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
            >
              <div className="relative pb-[100%]"> {/* Квадратный аспект */}
                {mainImage ? (
                  <OptimizedImage
                    src={mainImage.image_url}
                    alt={product.name}
                    fill
                    className="absolute h-full w-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      // Проверяем, не является ли уже изображением-заглушкой, чтобы избежать бесконечного цикла
                      if (!target.src.includes('placeholder-product.jpg')) {
                        target.src = '/placeholder-product.jpg';
                      }
                    }}
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute h-full w-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">Нет изображения</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-medium text-gray-800 group-hover:text-blue-600 mb-2 line-clamp-2 h-12">{product.name}</h3>
                <p className="text-lg font-bold text-gray-900">{product.price?.toLocaleString('ru-RU')} ₽</p>
              </div>
            </div>
          );
        })}
      </div>

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}