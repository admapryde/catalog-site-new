import { requireAdminSession } from '@/components/ProtectedRoute';
import CategoriesManager from '@/components/admin/CategoriesManager';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default async function CategoriesPage() {
  // Проверяем сессию администратора
  await requireAdminSession();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Сайдбар */}
        <AdminSidebar />

        {/* Основной контент */}
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            <CategoriesManager />
          </div>
        </main>
      </div>
    </div>
  );
}