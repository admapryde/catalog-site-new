'use client';

import { useState, useEffect } from 'react';
import { HeaderSettings } from '@/types';
import FileUpload from '@/components/admin/FileUpload';

interface HeaderSettingsFormProps {
  initialSettings: HeaderSettings;
  updateAction: (formData: FormData) => Promise<void>;
}

export default function HeaderSettingsForm({ initialSettings, updateAction }: HeaderSettingsFormProps) {
  const [formData, setFormData] = useState(initialSettings);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setFormData(initialSettings);
  }, [initialSettings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = (logoUrls: string[]) => {
    setFormData(prev => ({ ...prev, logo_image_url: logoUrls[0] || '' }));
  };

  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, logo_image_url: '' }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      // Создаем FormData вручную, чтобы использовать контролируемые компоненты
      const submitFormData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        submitFormData.append(key, value || '');
      });

      await updateAction(submitFormData);

      // Trigger the update-metadata event to refresh header settings on the client
      window.dispatchEvent(new Event('update-metadata'));

      setMessage({ type: 'success', text: 'Настройки успешно сохранены!' });
    } catch (error) {
      console.error('Ошибка обновления настроек:', error);
      setMessage({
        type: 'error',
        text: 'Ошибка при сохранении настроек. Пожалуйста, попробуйте снова.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Настройки шапки сайта</h2>

      {message && (
        <div className={`mb-4 p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="header_title">
            Заголовок (логотип)
          </label>
          <input
            id="header_title"
            name="header_title"
            type="text"
            value={formData.header_title}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nav_home">
            Навигация: Главная
          </label>
          <input
            id="nav_home"
            name="nav_home"
            type="text"
            value={formData.nav_home}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nav_catalog">
            Навигация: Каталог
          </label>
          <input
            id="nav_catalog"
            name="nav_catalog"
            type="text"
            value={formData.nav_catalog}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nav_about">
            Навигация: О нас
          </label>
          <input
            id="nav_about"
            name="nav_about"
            type="text"
            value={formData.nav_about}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nav_contacts">
            Навигация: Контакты
          </label>
          <input
            id="nav_contacts"
            name="nav_contacts"
            type="text"
            value={formData.nav_contacts}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="contact">
            Контакт (телефон или другая контактная информация)
          </label>
          <input
            id="contact"
            name="contact"
            type="text"
            value={formData.contact}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="+7 (XXX) XXX-XX-XX"
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="logo_image_url">
            Логотип
          </label>
          <input
            id="logo_image_url"
            name="logo_image_url"
            type="text"
            value={formData.logo_image_url}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-2"
            placeholder="URL изображения логотипа"
          />
          <div className="mt-2">
            <FileUpload
              onFileUpload={handleLogoUpload}
              folder="logos"
              label="Загрузить изображение для логотипа"
              isFavicon={false}
            />
          </div>
          {formData.logo_image_url && (
            <div className="mt-2">
              <p className="text-gray-600 text-sm">Текущий логотип:</p>
              <div className="flex items-center justify-between mt-1">
                <img
                  src={formData.logo_image_url}
                  alt="Текущий логотип"
                  className="h-40 object-contain border rounded"
                />
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="ml-4 bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded text-sm"
                >
                  Удалить
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
      </button>
    </form>
  );
}