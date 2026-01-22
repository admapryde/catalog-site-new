'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { HeaderSettings } from '@/types';

// Динамически импортируем Header с отключенным SSR
const DynamicHeader = dynamic(() => import('@/components/Header'), {
  ssr: false
});

// Ключ для хранения настроек шапки в localStorage
const HEADER_SETTINGS_CACHE_KEY = 'header_settings_cache';

export default function HeaderWrapper() {
  const [headerSettings, setHeaderSettings] = useState<HeaderSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Сначала пробуем получить настройки из localStorage
    const cachedSettings = localStorage.getItem(HEADER_SETTINGS_CACHE_KEY);
    let hasCachedSettings = false;

    if (cachedSettings) {
      try {
        const parsedSettings = JSON.parse(cachedSettings);
        setHeaderSettings(parsedSettings);
        hasCachedSettings = true;
      } catch (e) {
        console.error('Ошибка парсинга кэшированных настроек шапки:', e);
      }
    }

    const fetchHeaderSettings = async () => {
      try {
        // Используем уникальный параметр для обхода кэша CDN/proxy
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/header-settings?t=${timestamp}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });

        if (response.ok) {
          const settings: HeaderSettings = await response.json();

          // Обновляем состояние
          setHeaderSettings(settings);

          // Кэшируем настройки в localStorage
          localStorage.setItem(HEADER_SETTINGS_CACHE_KEY, JSON.stringify(settings));
        }
        // Если не удалось получить настройки, НЕ используем значения по умолчанию
        // просто оставляем текущие настройки (кэшированные или null)
      } catch (error) {
        console.error('Ошибка загрузки настроек шапки:', error);
        // В случае ошибки также не используем значения по умолчанию
      } finally {
        setIsLoading(false);
      }
    };

    // Если у нас есть кэшированные настройки, не показываем загрузку
    if (hasCachedSettings) {
      setIsLoading(false);
    }

    fetchHeaderSettings();

    // Добавляем прослушивание события обновления метаданных
    const handleUpdateMetadata = () => {
      fetchHeaderSettings();
    };

    window.addEventListener('update-metadata', handleUpdateMetadata);

    // Очищаем подписку при размонтировании
    return () => {
      window.removeEventListener('update-metadata', handleUpdateMetadata);
    };
  }, []);

  // Показываем пустой заголовок до тех пор, пока компонент не смонтирован
  // или пока идет загрузка и нет кэшированных настроек
  if (!mounted || (isLoading && !headerSettings)) {
    // Показываем пустую структуру без видимого содержимого
    return (
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-10">
            <div className="text-xl font-bold text-gray-800 opacity-0 pointer-events-none">
              {/* Этот div сохраняет место для текста, но делает его невидимым */}
              &nbsp;
            </div>
            <nav className="hidden md:flex space-x-6 opacity-0 pointer-events-none">
              <span className="text-gray-600">&nbsp;</span>
              <span className="text-gray-600">&nbsp;</span>
              <span className="text-gray-600">&nbsp;</span>
              <span className="text-gray-600">&nbsp;</span>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-full md:w-96 lg:w-[500px] xl:w-[600px] px-4 py-2 border border-gray-300 rounded-lg bg-gray-100">
              <div className="h-5 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  // Если есть настройки (кэшированные или загруженные), отображаем их
  if (headerSettings) {
    return <DynamicHeader settings={headerSettings} />;
  }

  // Если нет ни кэшированных, ни загруженных настроек, показываем пустой заголовок
  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-10">
          <div className="text-xl font-bold text-gray-800 opacity-0 pointer-events-none">
            &nbsp;
          </div>
          <nav className="hidden md:flex space-x-6 opacity-0 pointer-events-none">
            <span className="text-gray-600">&nbsp;</span>
            <span className="text-gray-600">&nbsp;</span>
            <span className="text-gray-600">&nbsp;</span>
            <span className="text-gray-600">&nbsp;</span>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <div className="w-full md:w-96 lg:w-[500px] xl:w-[600px] px-4 py-2 border border-gray-300 rounded-lg bg-gray-100">
            <div className="h-5 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    </header>
  );
}