'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import ProductModal from './ProductModal';
import { Product, ProductDetail, HeaderSettings } from '../types';

// Define types for search results
interface CategoryResult {
  id: string;
  name: string;
}

interface SearchResult {
  products: Product[];
  categories: CategoryResult[];
}

export default function Header({ settings }: { settings: HeaderSettings }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult>({ products: [], categories: [] });
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
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
  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setShowDropdown(false);
    }
  };

  // Добавляем обработчик события при монтировании
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Обновляем класс body при изменении состояния showMobileSearch
  useEffect(() => {
    if (showMobileSearch) {
      document.body.classList.add('mobile-search-open');
    } else {
      document.body.classList.remove('mobile-search-open');
    }
  }, [showMobileSearch]);

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
    <header className={`bg-white shadow-md sticky top-0 ${showMobileSearch ? 'z-[100001]' : 'z-50'} h-16`}> {/* Фиксированная высота шапки */}
      <div className="container mx-auto px-2 h-full flex items-center justify-between relative md:justify-start">

        {/* Логотип слева */}
        <div className="mr-6 z-20">
          {settings.logo_image_url ? (
            <Link href="/">
              <img
                src={settings.logo_image_url}
                alt={settings.header_title}
                className="h-12 object-contain md:h-16" // Уменьшен размер для мобильных
              />
            </Link>
          ) : (
            <Link href="/" className="text-xl font-bold text-gray-800 text-center">
              {settings.header_title}
            </Link>
          )}
        </div>

        {/* Навигация для десктопа - сразу после логотипа */}
        <nav className="hidden md:flex space-x-6 z-20">
          <Link href="/" className="text-base text-gray-600 hover:text-gray-900">
            {settings.nav_home}
          </Link>
          <Link href="/catalog" className="text-base text-gray-600 hover:text-gray-900">
            {settings.nav_catalog}
          </Link>
          <Link href="/about" className="text-base text-gray-600 hover:text-gray-900">
            {settings.nav_about}
          </Link>
          <Link href="/contacts" className="text-base text-gray-600 hover:text-gray-900">
            {settings.nav_contacts}
          </Link>
        </nav>

        {/* Пространство для заполнения между навигацией и правой частью */}
        <div className="flex-grow"></div>

        <div className="flex items-center space-x-6 z-20">
          {/* Отображение контактной информации для мобильных устройств перед кнопкой поиска */}
          <div className="md:hidden text-gray-600 mr-2">
            {settings.contact}
          </div>

          {/* Кнопка поиска для мобильных устройств */}
          <div className="md:hidden mr-2">
            <button
              onClick={() => {
                setShowMobileSearch(true);
                // Устанавливаем фокус на поле ввода после небольшой задержки, чтобы дать время для рендера
                setTimeout(() => {
                  const mobileSearchInput = document.getElementById('mobile-search-input');
                  if (mobileSearchInput) {
                    mobileSearchInput.focus();
                  }
                }, 100);
              }}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 focus:outline-none"
              aria-label="Поиск"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>

          {/* Мобильный модальный поиск */}
          {showMobileSearch && (
            <div className="fixed inset-0 z-[100002] md:hidden">
              {/* Overlay - создает эффект затемнения фона */}
              <div
                className="fixed inset-0"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.25)' }}
                onClick={() => {
                  setShowMobileSearch(false);
                  setSearchQuery(''); // Очищаем поле поиска при закрытии
                  setShowDropdown(false); // Закрываем выпадающий список
                }}
              ></div>

              <div className="relative z-[100003] pt-20 flex items-start justify-center min-h-screen">
                {/* Контейнер для строки поиска */}
                <div className="w-full max-w-md mx-4 mt-4 bg-white rounded-lg border border-gray-200 shadow-lg">
                  <div className="p-4">
                    <div className="flex items-center">
                      <form onSubmit={(e) => {
                        handleSearch(e);
                        setShowMobileSearch(false);
                      }} className="flex-grow">
                        <div className="relative">
                          <input
                            id="mobile-search-input"
                            type="text"
                            value={searchQuery}
                            onChange={handleInputChange}
                            onFocus={() => (searchResults.products.length > 0 || searchResults.categories.length > 0) && setShowDropdown(true)}
                            placeholder="Поиск"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-gray-600 placeholder-gray-500"
                          />
                          <button
                            type="submit"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-700 hover:text-black"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </button>
                        </div>
                      </form>
                      <button
                        type="button"
                        onClick={() => {
                          setShowMobileSearch(false);
                          setSearchQuery(''); // Очищаем поле поиска при закрытии
                          setShowDropdown(false); // Закрываем выпадающий список
                        }}
                        className="ml-2 text-gray-500 hover:text-gray-700"
                        aria-label="Закрыть поиск"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* Выпадающий список результатов поиска */}
                  {(showDropdown && (searchResults.products.length > 0 || searchResults.categories.length > 0)) && (
                    <div className="bg-white border-t border-gray-200 rounded-b-lg overflow-y-auto max-h-[calc(100vh-200px)] z-[100005]">
                      {/* Результаты по категориям */}
                      {searchResults.categories.length > 0 && (
                        <div>
                          <div className="px-4 py-2 bg-gray-50 text-gray-500 text-sm font-medium">Категории</div>
                          <ul>
                            {searchResults.categories.map((category) => (
                              <li key={`cat-${category.id}`}>
                                <Link
                                  href={`/catalog/${category.id}`}
                                  className="block px-4 py-2 hover:bg-gray-100 text-gray-800 truncate"
                                  onClick={() => {
                                    setSearchQuery(category.name);
                                    setShowDropdown(false);
                                    setShowMobileSearch(false); // Закрываем поле поиска на мобильном после выбора
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
                                    setShowMobileSearch(false); // Закрываем поле поиска на мобильном после выбора
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
              </div>
            </div>
          )}

          {/* Поисковая строка для десктопа - без изменений */}
          <div className="hidden md:flex flex-grow max-w-md">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleInputChange}
                  onFocus={() => (searchResults.products.length > 0 || searchResults.categories.length > 0) && setShowDropdown(true)}
                  placeholder="Поиск"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-gray-600 placeholder-gray-500"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-700 hover:text-black"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>

                {/* Выпадающий список результатов поиска для десктопа */}
                {showDropdown && (searchResults.products.length > 0 || searchResults.categories.length > 0) && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[100004] max-h-80 overflow-y-auto">
                    {/* Результаты по категориям */}
                    {searchResults.categories.length > 0 && (
                      <div>
                        <div className="px-4 py-2 bg-gray-50 text-gray-500 text-sm font-medium">Категории</div>
                        <ul>
                          {searchResults.categories.map((category) => (
                            <li key={`cat-${category.id}`}>
                              <Link
                                href={`/catalog/${category.id}`}
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

          {/* Отображение контактной информации в правой части экрана */}
          <div className="hidden md:block text-gray-600">
            {settings.contact}
          </div>
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