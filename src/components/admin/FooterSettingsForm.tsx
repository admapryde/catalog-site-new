'use client';

import { useState, useEffect } from 'react';
import { FooterSettings } from '@/services/footer-service';

interface FooterSettingsFormProps {
  initialSettings: FooterSettings;
  updateAction: (formData: FormData) => Promise<void>;
}

export default function FooterSettingsForm({ initialSettings, updateAction }: FooterSettingsFormProps) {
  const [formData, setFormData] = useState(initialSettings);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setFormData(initialSettings);
  }, [initialSettings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleContactChange = (index: number, value: string) => {
    setFormData(prev => {
      const updatedContacts = [...prev.contacts];
      if (index < updatedContacts.length) {
        updatedContacts[index] = { ...updatedContacts[index], value };
      } else {
        // Если индекс больше длины массива, добавляем новый контакт
        updatedContacts.push({ id: `contact_${index}`, value });
      }
      return { ...prev, contacts: updatedContacts };
    });
  };

  const handleQuickLinkChange = (index: number, field: 'label' | 'url', value: string) => {
    setFormData(prev => {
      const updatedLinks = [...prev.quick_links];
      if (index < updatedLinks.length) {
        updatedLinks[index] = { ...updatedLinks[index], [field]: value };
      } else {
        // Если индекс больше длины массива, добавляем новую ссылку
        updatedLinks.push({ id: `quick_link_${index}`, label: field === 'label' ? value : '', url: field === 'url' ? value : '' });
      }
      return { ...prev, quick_links: updatedLinks };
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      // Создаем FormData вручную, чтобы использовать контролируемые компоненты
      const submitFormData = new FormData();

      // Добавляем основные настройки
      submitFormData.append('footer_catalog_title', formData.footer_catalog_title || '');
      submitFormData.append('footer_catalog_desc', formData.footer_catalog_desc || '');
      submitFormData.append('footer_contacts_title', formData.footer_contacts_title || '');
      submitFormData.append('footer_quick_links_title', formData.footer_quick_links_title || '');

      // Добавляем контакты
      formData.contacts.forEach((contact, index) => {
        submitFormData.append(`contact_${index}`, contact.value || '');
      });

      // Добавляем быстрые ссылки
      formData.quick_links.forEach((link, index) => {
        submitFormData.append(`quick_link_label_${index}`, link.label || '');
        submitFormData.append(`quick_link_url_${index}`, link.url || '');
      });

      await updateAction(submitFormData);

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
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
      {/* Настройки блока "Каталог" */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Блок "Каталог"</h2>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="footer_catalog_title">
            Название блока
          </label>
          <input
            id="footer_catalog_title"
            name="footer_catalog_title"
            type="text"
            value={formData.footer_catalog_title}
            onChange={handleChange}
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
            value={formData.footer_catalog_desc}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
      </div>

      {/* Настройки блока "Контакты" */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Блок "Контакты"</h2>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="footer_contacts_title">
            Название блока
          </label>
          <input
            id="footer_contacts_title"
            name="footer_contacts_title"
            type="text"
            value={formData.footer_contacts_title}
            onChange={handleChange}
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
                  value={formData.contacts[index]?.value || ''}
                  onChange={(e) => handleContactChange(index, e.target.value)}
                  placeholder={`Контакт ${index + 1}`}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Настройки блока "Быстрые ссылки" */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Блок "Быстрые ссылки"</h2>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="footer_quick_links_title">
            Название блока
          </label>
          <input
            id="footer_quick_links_title"
            name="footer_quick_links_title"
            type="text"
            value={formData.footer_quick_links_title}
            onChange={handleChange}
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
                    value={formData.quick_links[index]?.label || ''}
                    onChange={(e) => handleQuickLinkChange(index, 'label', e.target.value)}
                    placeholder={`Текст ссылки ${index + 1}`}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                <div className="flex-1">
                  <input
                    name={`quick_link_url_${index}`}
                    type="text"
                    value={formData.quick_links[index]?.url || ''}
                    onChange={(e) => handleQuickLinkChange(index, 'url', e.target.value)}
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
  );
}