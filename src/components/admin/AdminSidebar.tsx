'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  username?: string;
  role?: string;
  children?: React.ReactNode;
}

// Компонент для группы меню с возможностью раскрытия/скрытия
const MenuGroup = ({ 
  title, 
  isOpen, 
  onToggle,
  children 
}: { 
  title: string; 
  isOpen: boolean; 
  onToggle: () => void; 
  children: React.ReactNode;
}) => {
  return (
    <div className="border-b border-gray-200">
      <button
        onClick={onToggle}
        className="flex justify-between items-center w-full py-3 px-6 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
        aria-expanded={isOpen}
      >
        <span>{title}</span>
        <svg 
          className={`h-5 w-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      {isOpen && (
        <div className="pl-4">{children}</div>
      )}
    </div>
  );
};

export default function AdminSidebar({ username, role, children }: SidebarProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Состояния для управления раскрывающимися группами меню
  const [homepageExpanded, setHomepageExpanded] = useState(false);
  const [headerFooterExpanded, setHeaderFooterExpanded] = useState(false);
  const [productEditorExpanded, setProductEditorExpanded] = useState(false);

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

  // Функция для проверки, находится ли текущий маршрут внутри группы
  const isInGroup = (groupPaths: string[]) => {
    return groupPaths.some(path => pathname.startsWith(path));
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

  // Устанавливаем начальное состояние для групп меню в зависимости от текущего пути
  useEffect(() => {
    setHomepageExpanded(isInGroup(['/admin/homepage', '/admin/categories', '/admin/banner-groups', '/admin/homepage-sections']));
    setHeaderFooterExpanded(isInGroup(['/admin/header-settings', '/admin/footer-settings']));
    setProductEditorExpanded(isInGroup(['/admin/products', '/admin/templates']));
  }, [pathname]);

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
              
              {/* Группа "Главная страница" с подменю */}
              <MenuGroup 
                title="Редактор главной" 
                isOpen={homepageExpanded} 
                onToggle={() => setHomepageExpanded(!homepageExpanded)}
              >
                <ul>
                  <li>
                    <a
                      href="/admin/homepage-editor"
                      onClick={handleLinkClick}
                      className={`block py-2 px-8 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 ${
                        isActive('/admin/homepage-editor')
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-transparent'
                      }`}
                    >
                      Блоки
                    </a>
                  </li>
                  <li>
                    <a
                      href="/admin/categories"
                      onClick={handleLinkClick}
                      className={`block py-2 px-8 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 ${
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
                      className={`block py-2 px-8 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 ${
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
                      className={`block py-2 px-8 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 ${
                        isActive('/admin/homepage-sections')
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-transparent'
                      }`}
                    >
                      Разделы ГС
                    </a>
                  </li>
                </ul>
              </MenuGroup>
              
              {/* Группа "Редактор товаров" */}
              <MenuGroup 
                title="Редактор товаров" 
                isOpen={productEditorExpanded} 
                onToggle={() => setProductEditorExpanded(!productEditorExpanded)}
              >
                <ul>
                  <li>
                    <a
                      href="/admin/products"
                      onClick={handleLinkClick}
                      className={`block py-2 px-8 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 ${
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
                      href="/admin/templates"
                      onClick={handleLinkClick}
                      className={`block py-2 px-8 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 ${
                        isActive('/admin/templates')
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-transparent'
                      }`}
                    >
                      Шаблон характеристик
                    </a>
                  </li>
                </ul>
              </MenuGroup>
              
              {/* Группа "Шапка и подвал" */}
              <MenuGroup 
                title="Шапка и подвал" 
                isOpen={headerFooterExpanded} 
                onToggle={() => setHeaderFooterExpanded(!headerFooterExpanded)}
              >
                <ul>
                  <li>
                    <a
                      href="/admin/header-settings"
                      onClick={handleLinkClick}
                      className={`block py-2 px-8 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 ${
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
                      className={`block py-2 px-8 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 ${
                        isActive('/admin/footer-settings')
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-transparent'
                      }`}
                    >
                      Подвал
                    </a>
                  </li>
                </ul>
              </MenuGroup>
              
              {/* Страницы */}
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
              
              {/* Настройки */}
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
            
            {/* Группа "Главная страница" с подменю */}
            <MenuGroup 
              title="Редактор главной" 
              isOpen={homepageExpanded} 
              onToggle={() => setHomepageExpanded(!homepageExpanded)}
            >
              <ul>
                <li>
                  <a
                    href="/admin/homepage-editor"
                    className={`block py-2 px-8 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 ${
                      isActive('/admin/homepage-editor')
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-transparent'
                    }`}
                  >
                    Блоки
                  </a>
                </li>
                <li>
                  <a
                    href="/admin/categories"
                    className={`block py-2 px-8 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 ${
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
                    className={`block py-2 px-8 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 ${
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
                    className={`block py-2 px-8 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 ${
                      isActive('/admin/homepage-sections')
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-transparent'
                    }`}
                  >
                    Разделы ГС
                  </a>
                </li>
              </ul>
            </MenuGroup>
            
            {/* Группа "Редактор товаров" */}
            <MenuGroup 
              title="Редактор товаров" 
              isOpen={productEditorExpanded} 
              onToggle={() => setProductEditorExpanded(!productEditorExpanded)}
            >
              <ul>
                <li>
                  <a
                    href="/admin/products"
                    className={`block py-2 px-8 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 ${
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
                    href="/admin/templates"
                    className={`block py-2 px-8 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 ${
                      isActive('/admin/templates')
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-transparent'
                    }`}
                  >
                    Шаблон характеристик
                  </a>
                </li>
              </ul>
            </MenuGroup>
            
            {/* Группа "Шапка и подвал" */}
            <MenuGroup 
              title="Шапка и подвал" 
              isOpen={headerFooterExpanded} 
              onToggle={() => setHeaderFooterExpanded(!headerFooterExpanded)}
            >
              <ul>
                <li>
                  <a
                    href="/admin/header-settings"
                    className={`block py-2 px-8 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 ${
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
                    className={`block py-2 px-8 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 ${
                      isActive('/admin/footer-settings')
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-transparent'
                    }`}
                  >
                    Подвал
                  </a>
                </li>
              </ul>
            </MenuGroup>
            
            {/* Страницы */}
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
            
            {/* Настройки */}
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