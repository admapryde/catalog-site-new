import { requireAdminSession } from '@/components/ProtectedRoute';
import BannerManager from '@/components/admin/BannerManager';
import AdminSidebar from '@/components/admin/AdminSidebar';
import ClientOnlyAdminPageWrapper from '@/components/admin/ClientOnlyAdminPageWrapper';

export default async function BannerGroupsPage() {
  // Проверяем сессию администратора
  await requireAdminSession();

  return (
    <ClientOnlyAdminPageWrapper>
      <BannerManager />
    </ClientOnlyAdminPageWrapper>
  );
}