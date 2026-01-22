import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase-server';
import AdminGuard from '@/components/AdminGuard';
import { redirect } from 'next/navigation';
import AuditHistoryDashboard from '@/components/admin/AuditHistoryDashboard';
import AdminSidebar from '@/components/admin/AdminSidebar';

interface Stats {
  products: number;
  categories: number;
  bannerGroups: number;
  homepageSections: number;
}

async function getStats(): Promise<Stats> {
  try {
    const supabase = await createClient();

    // Получаем количество товаров
    const { count: productsCount, error: productsError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (productsError) {
      throw productsError;
    }

    // Получаем количество категорий
    const { count: categoriesCount, error: categoriesError } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true });

    if (categoriesError) {
      throw categoriesError;
    }

    // Получаем количество групп баннеров
    const { count: bannerGroupsCount, error: bannerGroupsError } = await supabase
      .from('banner_groups')
      .select('*', { count: 'exact', head: true });

    if (bannerGroupsError) {
      throw bannerGroupsError;
    }

    // Получаем количество разделов главной страницы
    const { count: homepageSectionsCount, error: homepageSectionsError } = await supabase
      .from('homepage_sections')
      .select('*', { count: 'exact', head: true });

    if (homepageSectionsError) {
      throw homepageSectionsError;
    }

    return {
      products: productsCount || 0,
      categories: categoriesCount || 0,
      bannerGroups: bannerGroupsCount || 0,
      homepageSections: homepageSectionsCount || 0
    };
  } catch (error) {
    console.error('Ошибка получения статистики из Supabase:', error);
    // Возвращаем нули в случае ошибки
    return {
      products: 0,
      categories: 0,
      bannerGroups: 0,
      homepageSections: 0
    };
  }
}

export default async function AdminPage() {
  // Получаем информацию о пользователе через Supabase Auth
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Оборачиваем контент в AdminGuard для проверки сессии на клиентской стороне
  // Middleware уже обеспечивает базовую защиту маршрутов

  const adminInfo = {
    username: user?.email || user?.id || 'Unknown',
    role: user?.user_metadata?.role || 'user'
  };

  // Получаем статистику
  const stats = await getStats();

  // Оборачиваем контент в AdminGuard для дополнительной защиты на клиентской стороне
  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          {/* Сайдбар */}
          <AdminSidebar username={adminInfo.username} role={adminInfo.role} />

          {/* Основной контент */}
          <main className="flex-1 p-8">
            <div className="max-w-6xl mx-auto">
              <h1 className="text-3xl font-bold text-gray-800 mb-6">Дашборд</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-700 mb-2">Всего товаров</h3>
                  <p className="text-3xl font-bold text-blue-600">{stats.products}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-700 mb-2">Всего разделов</h3>
                  <p className="text-3xl font-bold text-green-600">{stats.categories}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-700 mb-2">Групп баннеров</h3>
                  <p className="text-3xl font-bold text-purple-600">{stats.bannerGroups}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-700 mb-2">Разделов ГС</h3>
                  <p className="text-3xl font-bold text-orange-600">{stats.homepageSections}</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Последние действия</h2>
                <div className="h-96 overflow-y-auto">
                  <AuditHistoryDashboard />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}