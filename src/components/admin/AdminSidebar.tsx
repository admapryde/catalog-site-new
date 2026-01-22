'use client';

import { usePathname } from 'next/navigation';

interface SidebarProps {
  username?: string;
  role?: string;
  children?: React.ReactNode;
}

export default function AdminSidebar({ username, role, children }: SidebarProps) {
  const pathname = usePathname();

  // Функция для проверки активности ссылки
  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <aside className="w-64 bg-white shadow-md min-h-screen">
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
              Футтер
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
        </ul>
      </nav>
      {children && <div>{children}</div>}
    </aside>
  );
}