import { requireAdminSession } from '@/components/ProtectedRoute';
import CategoriesManager from '@/components/admin/CategoriesManager';
import AdminSidebar from '@/components/admin/AdminSidebar';
import ClientOnlyAdminPageWrapper from '@/components/admin/ClientOnlyAdminPageWrapper';

export default async function CategoriesPage() {
  // Проверяем сессию администратора
  await requireAdminSession();

  return (
    <ClientOnlyAdminPageWrapper>
      <CategoriesManager />
    </ClientOnlyAdminPageWrapper>
  );
}