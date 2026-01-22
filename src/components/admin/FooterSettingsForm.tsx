'use client';

import { useState, useEffect } from 'react';
import { FooterSettings } from '@/services/footer-service';

interface FooterSettingsFormProps {
  initialSettings: FooterSettings;
  updateAction: (formData: FormData) => Promise<void>;
}

export default function FooterSettingsForm({ initialSettings, updateAction }: FooterSettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    setIsSubmitting(true);
    setMessage(null);
    
    try {
      await updateAction(formData);
      
      // Trigger the update-metadata event to refresh footer settings on the client
      window.dispatchEvent(new Event('update-metadata'));
      
      setMessage({ type: 'success', text: 'Настройки футера успешно сохранены!' });
    } catch (error) {
      console.error('Ошибка обновления настроек футера:', error);
      setMessage({ 
        type: 'error', 
        text: 'Ошибка при сохранении настроек футера. Пожалуйста, попробуйте снова.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        {/* Настройки блока "Каталог" */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Блок "Каталог"</h2>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="footer_catalog_title">
              Название блока
            </label>
            <input
              id="footer_catalog_title"
              name="footer_catalog_title"
              type="text"
              defaultValue={initialSettings.footer_catalog_title}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="footer_catalog_desc">
              Описание блока
            </label>
            <textarea
              id="footer_catalog_desc"
              name="footer_catalog_desc"
              rows={3}
              defaultValue={initialSettings.footer_catalog_desc}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
        </div>

        {/* Настройки блока "Контакты" */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Блок "Контакты"</h2>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="footer_contacts_title">
              Название блока
            </label>
            <input
              id="footer_contacts_title"
              name="footer_contacts_title"
              type="text"
              defaultValue={initialSettings.footer_contacts_title}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Контактная информация (до 8 полей)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index}>
                  <input
                    name={`contact_${index}`}
                    type="text"
                    defaultValue={initialSettings.contacts[index]?.value || ''}
                    placeholder={`Контакт ${index + 1}`}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Настройки блока "Быстрые ссылки" */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Блок "Быстрые ссылки"</h2>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="footer_quick_links_title">
              Название блока
            </label>
            <input
              id="footer_quick_links_title"
              name="footer_quick_links_title"
              type="text"
              defaultValue={initialSettings.footer_quick_links_title}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Быстрые ссылки (до 8 ссылок)
            </label>
            <div className="space-y-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="flex space-x-4">
                  <div className="flex-1">
                    <input
                      name={`quick_link_label_${index}`}
                      type="text"
                      defaultValue={initialSettings.quick_links[index]?.label || ''}
                      placeholder={`Текст ссылки ${index + 1}`}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      name={`quick_link_url_${index}`}
                      type="text"
                      defaultValue={initialSettings.quick_links[index]?.url || ''}
                      placeholder={`URL ${index + 1}`}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.text}
          </div>
        )}

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