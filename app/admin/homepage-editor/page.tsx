import { requireAdminSession } from '@/components/ProtectedRoute';
import HomepageEditor from '@/components/admin/HomepageEditor';
import ClientOnlyAdminPageWrapper from '@/components/admin/ClientOnlyAdminPageWrapper';

export default async function HomepageEditorPage() {
  // Проверяем сессию администратора
  await requireAdminSession();

  return (
    <ClientOnlyAdminPageWrapper>
      <HomepageEditor />
    </ClientOnlyAdminPageWrapper>
  );
}