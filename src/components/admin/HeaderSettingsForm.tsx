'use client';

import { useState, useEffect } from 'react';
import { HeaderSettings } from '@/types';
import FileUpload from '@/components/admin/FileUpload';

interface HeaderSettingsFormProps {
  initialSettings: HeaderSettings;
  updateAction: (formData: FormData) => Promise<void>;
}

export default function HeaderSettingsForm({ initialSettings, updateAction }: HeaderSettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    setIsSubmitting(true);
    setMessage(null);
    
    try {
      await updateAction(formData);
      
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
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Настройки шапки сайта</h2>
      
      {message && (
        <div className={`mb-4 p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="header_title">
              Заголовок (логотип)
            </label>
            <input
              id="header_title"
              name="header_title"
              type="text"
              defaultValue={initialSettings.header_title}
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
              defaultValue={initialSettings.nav_home}
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
              defaultValue={initialSettings.nav_catalog}
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
              defaultValue={initialSettings.nav_about}
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
              defaultValue={initialSettings.nav_contacts}
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
              defaultValue={initialSettings.contact}
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
              defaultValue={initialSettings.logo_image_url}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-2"
              placeholder="URL изображения логотипа"
            />
            <div className="mt-2">
              <label className="block text-gray-700 text-sm font-bold mb-2">Загрузить новое изображение</label>
              <FileUpload
                onFileUpload={(urls) => {
                  const logoInput = document.getElementById('logo_image_url') as HTMLInputElement;
                  if (logoInput && urls.length > 0) {
                    logoInput.value = urls[0];
                  }
                }}
                folder="logos"
                label="Выберите изображение для логотипа"
                multiple={false}
              />
            </div>
            {initialSettings.logo_image_url && (
              <div className="mt-2">
                <label className="block text-gray-700 text-sm font-bold mb-2">Текущий логотип</label>
                <img
                  src={initialSettings.logo_image_url}
                  alt="Текущий логотип"
                  className="h-40 object-contain border rounded"
                />
                <button
                  type="button"
                  onClick={() => {
                    const logoInput = document.getElementById('logo_image_url') as HTMLInputElement;
                    if (logoInput) {
                      logoInput.value = '';
                    }
                  }}
                  className="mt-2 text-red-600 hover:text-red-800 text-sm"
                >
                  Удалить логотип
                </button>
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
    </div>
  );
}