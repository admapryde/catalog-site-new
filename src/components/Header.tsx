'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import ProductModal from './ProductModal';
import { Product, ProductDetail } from '../types';

// Define types for search results
interface CategoryResult {
  id: string;
  name: string;
}

interface SearchResult {
  products: Product[];
  categories: CategoryResult[];
}

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult>({ products: [], categories: [] });
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null); // Using any temporarily since we need to fetch full product details
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/catalog?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  // Функция для выполнения поиска
  const performSearch = async (query: string) => {
    if (query.trim()) {
      try {
        const response = await fetch(`/api/search?search=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data: SearchResult = await response.json();
          setSearchResults(data);
          setShowDropdown(true);
        } else {
          setSearchResults({ products: [], categories: [] });
        }
      } catch (error) {
        console.error('Ошибка при поиске:', error);
        setSearchResults({ products: [], categories: [] });
      }
    } else {
      setSearchResults({ products: [], categories: [] });
      setShowDropdown(false);
    }
  };

  // Обработчик изменения значения в поле поиска
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Выполняем поиск с задержкой для оптимизации
    if (value.trim()) {
      setTimeout(() => {
        performSearch(value);
      }, 300); // Задержка 300мс перед выполнением поиска
    } else {
      setSearchResults({ products: [], categories: [] });
      setShowDropdown(false);
    }
  };

  // Обработчик клика вне компонента для закрытия выпадающего списка
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Функция для открытия модального окна с деталями продукта
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
      setShowDropdown(false); // Закрываем выпадающий список
    } catch (error) {
      console.error('Ошибка загрузки деталей товара:', error);
      // Fallback to navigation if API fails
      window.location.href = `/product/${productId}`;
    }
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-10">
          {/* Логотип */}
          <Link href="/" className="text-xl font-bold text-gray-800">
            Каталог
          </Link>

          {/* Навигация */}
          <nav className="hidden md:flex space-x-6">
            <Link href="/" className="text-gray-600 hover:text-gray-900">Главная</Link>
            <Link href="/catalog" className="text-gray-600 hover:text-gray-900">Каталог</Link>
            <Link href="/about" className="text-gray-600 hover:text-gray-900">О нас</Link>
            <Link href="/contacts" className="text-gray-600 hover:text-gray-900">Контакты</Link>
          </nav>
        </div>

        <div className="flex items-center space-x-4 relative" ref={dropdownRef}>
          {/* Поисковая строка */}
          <form onSubmit={handleSearch} className="w-full">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={handleInputChange}
                onFocus={() => (searchResults.products.length > 0 || searchResults.categories.length > 0) && setShowDropdown(true)}
                placeholder="Поиск товаров и категорий..."
                className="w-full md:w-96 lg:w-[500px] xl:w-[600px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-gray-900 placeholder-gray-700"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-700 hover:text-black"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Выпадающий список результатов поиска */}
              {showDropdown && (searchResults.products.length > 0 || searchResults.categories.length > 0) && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                  {/* Результаты по категориям */}
                  {searchResults.categories.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-gray-50 text-gray-500 text-sm font-medium">Категории</div>
                      <ul>
                        {searchResults.categories.map((category) => (
                          <li key={`cat-${category.id}`}>
                            <Link
                              href={`/catalog?category_id=${category.id}`}
                              className="block px-4 py-2 hover:bg-gray-100 text-gray-800 truncate"
                              onClick={() => {
                                setSearchQuery(category.name);
                                setShowDropdown(false);
                              }}
                            >
                              {category.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Результаты по товарам */}
                  {searchResults.products.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-gray-50 text-gray-500 text-sm font-medium">Товары</div>
                      <ul>
                        {searchResults.products.map((product) => (
                          <li key={`prod-${product.id}`}>
                            <div
                              className="block px-4 py-2 hover:bg-gray-100 text-gray-800 truncate cursor-pointer"
                              onClick={() => {
                                setSearchQuery(product.name);
                                handleProductClick(product.id);
                              }}
                            >
                              {product.name}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Модальное окно для просмотра товара */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </header>
  );
}