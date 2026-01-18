'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
  category_id: string;
  description?: string;
  images?: Array<{
    id: string;
    url: string;
    alt: string;
  }>;
}

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
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
        const response = await fetch(`/api/products?search=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.slice(0, 5)); // Ограничиваем до 5 результатов
          setShowDropdown(true);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Ошибка при поиске:', error);
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
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
      setSearchResults([]);
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
          <form onSubmit={handleSearch} className="max-w-lg">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={handleInputChange}
                onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                placeholder="Поиск товаров..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-500"
              >
                🔍
              </button>

              {/* Выпадающий список результатов поиска */}
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                  <ul>
                    {searchResults.map((product) => (
                      <li key={product.id}>
                        <Link
                          href={`/product/${product.id}`}
                          className="block px-4 py-2 hover:bg-gray-100 text-gray-800 truncate"
                          onClick={() => {
                            setSearchQuery(product.name);
                            setShowDropdown(false);
                          }}
                        >
                          {product.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </header>
  );
}