import { requireAdminSession } from '@/components/ProtectedRoute';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { getGeneralSettings } from '@/services/general-settings-service';
import GeneralSettingsForm from '@/components/admin/GeneralSettingsForm';

export default async function SettingsPage() {
  // Проверяем сессию администратора
  await requireAdminSession();

  // Получаем текущие настройки
  const settings = await getGeneralSettings();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Сайдбар */}
        <AdminSidebar />

        {/* Основной контент */}
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Настройки</h1>

            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Общие настройки</h2>
              <GeneralSettingsForm initialSettings={settings} />
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}