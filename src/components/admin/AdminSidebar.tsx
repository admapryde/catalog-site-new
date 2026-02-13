'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  username?: string;
  role?: string;
  children?: React.ReactNode;
}

export default function AdminSidebar({ username, role, children }: SidebarProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Проверяем, является ли устройство мобильным
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false); // Закрываем меню на десктопе
      }
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  // Функция для проверки активности ссылки
  const isActive = (path: string) => {
    return pathname === path;
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.ok) {
        // Перенаправляем на страницу логина
        window.location.href = data.url;
      } else {
        console.error('Ошибка при выходе:', data.error);
        alert('Произошла ошибка при выходе из системы');
      }
    } catch (error) {
      console.error('Ошибка при выходе:', error);
      alert('Произошла ошибка при выходе из системы');
    }
  };

  // Закрываем мобильное меню при переходе по ссылке
  const handleLinkClick = () => {
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <>
      {/* Кнопка для открытия мобильного меню */}
      {isMobile && (
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="fixed top-4 left-4 z-50 p-2 bg-blue-600 text-white rounded-md shadow-lg md:hidden"
          aria-label="Меню админ-панели"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Мобильное меню */}
      {isMobile && (
        <div 
          className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-40 transform transition-transform duration-300 ease-in-out ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800">Админ-панель</h2>
            {username && (
              <div className="mt-4 text-sm text-gray-600">
                <p>Пользователь: {username}</p>
                <p>Роль: {role}</p>
              </div>
            )}
          </div>
          <nav className="mt-6">
            <ul>
              <li>
                <a
                  href="/admin"
                  onClick={handleLinkClick}
                  className={`block py-3 px-6 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 ${
                    isActive('/admin')
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-transparent'
                  }`}
                >
                  Дашборд
                </a>
              </li>
              <li>
                <a
                  href="/admin/categories"
                  onClick={handleLinkClick}
                  className={`block py-3 px-6 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 ${
                    isActive('/admin/categories')
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-transparent'
                  }`}
                >
                  Разделы
                </a>
              </li>
              <li>
                <a
                  href="/admin/banner-groups"
                  onClick={handleLinkClick}
                  className={`block py-3 px-6 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 ${
                    isActive('/admin/banner-groups')
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-transparent'
                  }`}
                >
                  Баннеры
                </a>
              </li>
              <li>
                <a
                  href="/admin/homepage-sections"
                  onClick={handleLinkClick}
                  className={`block py-3 px-6 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 ${
                    isActive('/admin/homepage-sections')
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-transparent'
                  }`}
                >
                  Разделы ГС
                </a>
              </li>
              <li>
                <a
                  href="/admin/homepage-editor"
                  onClick={handleLinkClick}
                  className={`block py-3 px-6 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 ${
                    isActive('/admin/homepage-editor')
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-transparent'
                  }`}
                >
                  Редактор главной
                </a>
              </li>
              <li>
                <a
                  href="/admin/templates"
                  onClick={handleLinkClick}
                  className={`block py-3 px-6 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 ${
                    isActive('/admin/templates')
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-transparent'
                  }`}
                >
                  Шаблоны
                </a>
              </li>
              <li>
                <a
                  href="/admin/products"
                  onClick={handleLinkClick}
                  className={`block py-3 px-6 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 ${
                    isActive('/admin/products')
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-transparent'
                  }`}
                >
                  Товары
                </a>
              </li>
              <li>
                <a
                  href="/admin/header-settings"
                  onClick={handleLinkClick}
                  className={`block py-3 px-6 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 ${
                    isActive('/admin/header-settings')
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-transparent'
                  }`}
                >
                  Шапка сайта
                </a>
              </li>
              <li>
                <a
                  href="/admin/footer-settings"
                  onClick={handleLinkClick}
                  className={`block py-3 px-6 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 ${
                    isActive('/admin/footer-settings')
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-transparent'
                  }`}
                >
                  Подвал
                </a>
              </li>
              <li>
                <a
                  href="/admin/pages"
                  onClick={handleLinkClick}
                  className={`block py-3 px-6 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 ${
                    isActive('/admin/pages')
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-transparent'
                  }`}
                >
                  Страницы
                </a>
              </li>
              <li>
                <a
                  href="/admin/settings"
                  onClick={handleLinkClick}
                  className={`block py-3 px-6 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 ${
                    isActive('/admin/settings')
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-transparent'
                  }`}
                >
                  Настройки
                </a>
              </li>
              <li>
                <button
                  onClick={handleLogout}
                  className="w-full text-left py-3 px-6 text-red-600 hover:bg-red-50 hover:text-red-700 border-l-4 border-transparent cursor-pointer"
                >
                  Выход
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}

      {/* Overlay для мобильного меню */}
      {isMobile && isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black opacity-50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Десктопное меню */}
      <aside className={`${isMobile ? 'hidden' : 'w-64'} bg-white shadow-md min-h-screen`}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800">Админ-панель</h2>
          {username && (
            <div className="mt-4 text-sm text-gray-600">
              <p>Пользователь: {username}</p>
              <p>Роль: {role}</p>
            </div>
          )}
        </div>
        <nav className="mt-6">
          <ul>
            <li>
              <a
                href="/admin"
                className={`block py-3 px-6 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 ${
                  isActive('/admin')
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-transparent'
                }`}
              >
                Дашборд
              </a>
            </li>
            <li>
              <a
                href="/admin/categories"
                className={`block py-3 px-6 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 ${
                  isActive('/admin/categories')
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-transparent'
                }`}
              >
                Разделы
              </a>
            </li>
            <li>
              <a
                href="/admin/banner-groups"
                className={`block py-3 px-6 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 ${
                  isActive('/admin/banner-groups')
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-transparent'
                }`}
              >
                Баннеры
              </a>
            </li>
            <li>
              <a
                href="/admin/homepage-sections"
                className={`block py-3 px-6 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 ${
                  isActive('/admin/homepage-sections')
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-transparent'
                }`}
              >
                Разделы ГС
              </a>
            </li>
            <li>
              <a
                href="/admin/homepage-editor"
                className={`block py-3 px-6 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 ${
                  isActive('/admin/homepage-editor')
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-transparent'
                }`}
              >
                Редактор главной
              </a>
            </li>
            <li>
              <a
                href="/admin/templates"
                className={`block py-3 px-6 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 ${
                  isActive('/admin/templates')
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-transparent'
                }`}
              >
                Шаблоны
              </a>
            </li>
            <li>
              <a
                href="/admin/products"
                className={`block py-3 px-6 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 ${
                  isActive('/admin/products')
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-transparent'
                }`}
              >
                Товары
              </a>
            </li>
            <li>
              <a
                href="/admin/header-settings"
                className={`block py-3 px-6 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 ${
                  isActive('/admin/header-settings')
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-transparent'
                }`}
              >
                Шапка сайта
              </a>
            </li>
            <li>
              <a
                href="/admin/footer-settings"
                className={`block py-3 px-6 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 ${
                  isActive('/admin/footer-settings')
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-transparent'
                }`}
              >
                Подвал
              </a>
            </li>
            <li>
              <a
                href="/admin/pages"
                className={`block py-3 px-6 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 ${
                  isActive('/admin/pages')
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-transparent'
                }`}
              >
                Страницы
              </a>
            </li>
            <li>
              <a
                href="/admin/settings"
                className={`block py-3 px-6 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 ${
                  isActive('/admin/settings')
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-transparent'
                }`}
              >
                Настройки
              </a>
            </li>
            <li>
              <button
                onClick={handleLogout}
                className="w-full text-left py-3 px-6 text-red-600 hover:bg-red-50 hover:text-red-700 border-l-4 border-transparent cursor-pointer"
              >
                Выход
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      {children && <div>{children}</div>}
    </>
  );
}