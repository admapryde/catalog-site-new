import { requireAdminSession } from '@/components/ProtectedRoute';

export default async function SettingsPage() {
  // Проверяем сессию администратора
  await requireAdminSession();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Сайдбар */}
        <aside className="w-64 bg-white shadow-md min-h-screen">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800">Админ-панель</h2>
          </div>
          <nav className="mt-6">
            <ul>
              <li>
                <a href="/admin" className="block py-3 px-6 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 border-transparent">
                  Дашборд
                </a>
              </li>
              <li>
                <a href="/admin/categories" className="block py-3 px-6 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 border-transparent">
                  Разделы
                </a>
              </li>
              <li>
                <a href="/admin/banner-groups" className="block py-3 px-6 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 border-transparent">
                  Баннеры
                </a>
              </li>
              <li>
                <a href="/admin/homepage-sections" className="block py-3 px-6 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 border-transparent">
                  Разделы ГС
                </a>
              </li>
              <li>
                <a href="/admin/products" className="block py-3 px-6 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 border-transparent">
                  Товары
                </a>
              </li>
              <li>
                <a href="/admin/settings" className="block py-3 px-6 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 border-blue-600 bg-blue-50">
                  Настройки
                </a>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Основной контент */}
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Настройки</h1>

            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Общие настройки</h2>
              <form>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="siteName">
                    Название сайта
                  </label>
                  <input
                    id="siteName"
                    type="text"
                    defaultValue="Универсальный каталог"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="logoUrl">
                    URL логотипа
                  </label>
                  <input
                    id="logoUrl"
                    type="text"
                    defaultValue="/logo.png"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="footerInfo">
                    Информация в футере
                  </label>
                  <textarea
                    id="footerInfo"
                    rows={4}
                    defaultValue="© 2023 Универсальный каталог. Все права защищены."
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Сохранить изменения
                </button>
              </form>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Настройки безопасности</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-800">Двухфакторная аутентификация</h3>
                    <p className="text-gray-600">Добавьте дополнительный уровень безопасности к вашей учетной записи</p>
                  </div>
                  <button className="bg-gray-200 relative inline-flex h-6 w-11 items-center rounded-full">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-1"></span>
                  </button>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Сменить пароль</h3>
                  <form className="space-y-4">
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="currentPassword">
                        Текущий пароль
                      </label>
                      <input
                        id="currentPassword"
                        type="password"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newPassword">
                        Новый пароль
                      </label>
                      <input
                        id="newPassword"
                        type="password"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">
                        Подтвердите пароль
                      </label>
                      <input
                        id="confirmPassword"
                        type="password"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      />
                    </div>

                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                      Сменить пароль
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}