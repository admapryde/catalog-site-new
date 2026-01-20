'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { HeaderSettings } from '@/types';

export default function HeaderWrapper() {
  const [headerSettings, setHeaderSettings] = useState<HeaderSettings | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fetchHeaderSettings = async () => {
      try {
        const response = await fetch('/api/header-settings');
        if (response.ok) {
          const settings: HeaderSettings = await response.json();
          setHeaderSettings(settings);
        } else {
          // Если не удалось получить настройки, используем значения по умолчанию
          setHeaderSettings({
            header_title: 'Каталог',
            nav_home: 'Главная',
            nav_catalog: 'Каталог',
            nav_about: 'О нас',
            nav_contacts: 'Контакты'
          });
        }
      } catch (error) {
        console.error('Ошибка загрузки настроек шапки:', error);
        // В случае ошибки используем значения по умолчанию
        setHeaderSettings({
          header_title: 'Каталог',
          nav_home: 'Главная',
          nav_catalog: 'Каталог',
          nav_about: 'О нас',
          nav_contacts: 'Контакты'
        });
      }
    };

    fetchHeaderSettings();
  }, []);

  if (!mounted || !headerSettings) {
    // Показываем заглушку до тех пор, пока данные не загрузятся
    return (
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-10">
            <div className="text-xl font-bold text-gray-800">Каталог</div>
            <nav className="hidden md:flex space-x-6">
              <span className="text-gray-600">Главная</span>
              <span className="text-gray-600">Каталог</span>
              <span className="text-gray-600">О нас</span>
              <span className="text-gray-600">Контакты</span>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-full md:w-96 lg:w-[500px] xl:w-[600px] px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 animate-pulse">
              <div className="h-5 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return <Header settings={headerSettings} />;
}