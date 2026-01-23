import { requireAdminSession } from '@/components/ProtectedRoute';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { getGeneralSettings } from '@/services/general-settings-service';
import GeneralSettingsForm from '@/components/admin/GeneralSettingsForm';
import ClientOnlyAdminPageWrapper from '@/components/admin/ClientOnlyAdminPageWrapper';

export default async function SettingsPage() {
  // Проверяем сессию администратора
  await requireAdminSession();

  // Получаем текущие настройки
  const settings = await getGeneralSettings();

  return (
    <ClientOnlyAdminPageWrapper>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Настройки</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Общие настройки</h2>
        <GeneralSettingsForm initialSettings={settings} />
      </div>
    </ClientOnlyAdminPageWrapper>
  );
}