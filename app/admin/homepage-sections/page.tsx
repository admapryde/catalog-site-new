import { requireAdminSession } from '@/components/ProtectedRoute';
import HomepageSectionsManager from '@/components/admin/HomepageSectionsManager';

export default async function HomepageSectionsPage() {
  // Проверяем сессию администратора
  await requireAdminSession();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Сайдбар */}
        <aside className="w-64 bg-white shadow-md min-h-screen">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800">Админ-панель</h2>
          </div>
          <nav className="mt-6">
            <ul>
              <li>
                <a href="/admin" className="block py-3 px-6 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 border-transparent">
                  Дашборд
                </a>
              </li>
              <li>
                <a href="/admin/categories" className="block py-3 px-6 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 border-transparent">
                  Разделы
                </a>
              </li>
              <li>
                <a href="/admin/banner-groups" className="block py-3 px-6 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 border-transparent">
                  Баннеры
                </a>
              </li>
              <li>
                <a href="/admin/homepage-sections" className="block py-3 px-6 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 border-blue-600 bg-blue-50">
                  Разделы ГС
                </a>
              </li>
              <li>
                <a href="/admin/products" className="block py-3 px-6 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 border-transparent">
                  Товары
                </a>
              </li>
              <li>
                <a href="/admin/settings" className="block py-3 px-6 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 border-transparent">
                  Настройки
                </a>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Основной контент */}
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            <HomepageSectionsManager />
          </div>
        </main>
      </div>
    </div>
  );
}