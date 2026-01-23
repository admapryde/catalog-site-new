import { requireAdminSession } from '@/components/ProtectedRoute';
import AdminSidebar from '@/components/admin/AdminSidebar';
import PagesManager from '@/components/admin/PagesManager';
import ClientOnlyAdminPageWrapper from '@/components/admin/ClientOnlyAdminPageWrapper';

export default async function PagesPage() {
  // Проверяем сессию администратора
  await requireAdminSession();

  return (
    <ClientOnlyAdminPageWrapper>
      <PagesManager />
    </ClientOnlyAdminPageWrapper>
  );
}