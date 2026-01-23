import { requireAdminSession } from '@/components/ProtectedRoute';
import HomepageSectionsManager from '@/components/admin/HomepageSectionsManager';
import AdminSidebar from '@/components/admin/AdminSidebar';
import ClientOnlyAdminPageWrapper from '@/components/admin/ClientOnlyAdminPageWrapper';

export default async function HomepageSectionsPage() {
  // Проверяем сессию администратора
  await requireAdminSession();

  return (
    <ClientOnlyAdminPageWrapper>
      <HomepageSectionsManager />
    </ClientOnlyAdminPageWrapper>
  );
}