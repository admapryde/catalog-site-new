import { requireAdminSession } from '@/components/ProtectedRoute';
import ProductsManager from '@/components/admin/ProductsManager';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default async function ProductsPage() {
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
            <ProductsManager />
          </div>
        </main>
      </div>
    </div>
  );
}