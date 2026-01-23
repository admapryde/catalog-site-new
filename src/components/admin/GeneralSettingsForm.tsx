'use client';

import { useState, useEffect } from 'react';
import FileUpload from './FileUpload';

interface GeneralSettings {
  site_title: string;
  site_icon: string;
  site_footer_info: string;
}

interface GeneralSettingsFormProps {
  initialSettings: GeneralSettings;
}

export default function GeneralSettingsForm({ initialSettings }: GeneralSettingsFormProps) {
  const [formData, setFormData] = useState(initialSettings);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setFormData(initialSettings);
  }, [initialSettings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSiteIconUpload = (iconUrls: string[]) => {
    setFormData(prev => ({ ...prev, site_icon: iconUrls[0] || '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      console.log('Отправляем данные:', {
        site_title: formData.site_title,
        site_icon: formData.site_icon,
        site_footer_info: formData.site_footer_info,
      });

      const response = await fetch('/api/general-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          site_title: formData.site_title,
          site_icon: formData.site_icon,
          site_footer_info: formData.site_footer_info,
        }),
      });

      console.log('Ответ от сервера:', response.status);

      if (response.ok) {
        const responseData = await response.json();
        console.log('Ответ от сервера:', responseData);
        setMessage('Настройки успешно сохранены!');

        // Вызываем событие для обновления метаданных в других компонентах
        window.dispatchEvent(new CustomEvent('update-metadata'));
      } else {
        const errorData = await response.json();
        console.error('Ошибка от сервера:', errorData);
        setMessage(`Ошибка: ${errorData.error || 'Неизвестная ошибка'}`);
      }
    } catch (error) {
      console.error('Ошибка при сохранении настроек:', error);
      setMessage('Ошибка при сохранении настроек');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="site_title">
          Название сайта
        </label>
        <input
          id="site_title"
          name="site_title"
          type="text"
          value={formData.site_title}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="site_icon">
          Иконка сайта
        </label>
        <FileUpload 
          onFileUpload={handleSiteIconUpload} 
          folder="site-icons" 
          label="Загрузить иконку сайта" 
        />
        {formData.site_icon && (
          <div className="mt-2">
            <p className="text-gray-600 text-sm">Текущая иконка:</p>
            <img 
              src={formData.site_icon} 
              alt="Текущая иконка сайта" 
              className="w-16 h-16 object-contain mt-1 border rounded"
            />
            <input
              type="hidden"
              name="site_icon"
              value={formData.site_icon}
            />
          </div>
        )}
      </div>

      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="site_footer_info">
          Информация в футере
        </label>
        <textarea
          id="site_footer_info"
          name="site_footer_info"
          rows={4}
          value={formData.site_footer_info}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        ></textarea>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
      </button>

      {message && (
        <div className={`mt-4 p-3 rounded ${message.includes('успешно') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}
    </form>
  );
}