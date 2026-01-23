import { requireAdminSession } from '@/components/ProtectedRoute';
import TemplatesManager from '@/components/admin/TemplatesManager';
import AdminSidebar from '@/components/admin/AdminSidebar';
import ClientOnlyAdminPageWrapper from '@/components/admin/ClientOnlyAdminPageWrapper';

export default async function TemplatesPage() {
  // Проверяем сессию администратора
  await requireAdminSession();

  return (
    <ClientOnlyAdminPageWrapper>
      <TemplatesManager />
    </ClientOnlyAdminPageWrapper>
  );
}