'use client';

import { ReactNode, useState, useEffect } from 'react';

interface GeneralSettings {
  bg_image?: string;
}

interface ThemedContainerProps {
  children: ReactNode;
  className?: string;
}

export default function ThemedContainer({ children, className = '' }: ThemedContainerProps) {
  const [bgImage, setBgImage] = useState<string | undefined>(undefined);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/general-settings');
        if (response.ok) {
          const settings: GeneralSettings = await response.json();
          setBgImage(settings.bg_image);
        }
      } catch (error) {
        console.error('Ошибка загрузки настроек фона:', error);
      }
    };

    fetchSettings();

    // Подписываемся на событие обновления метаданных
    const handleUpdateMetadata = () => {
      fetchSettings();
    };

    window.addEventListener('update-metadata', handleUpdateMetadata);

    return () => {
      window.removeEventListener('update-metadata', handleUpdateMetadata);
    };
  }, []);

  // Если есть фоновое изображение, делаем контейнер полупрозрачным, чтобы показать фон
  const containerClass = bgImage
    ? `bg-white bg-opacity-85 ${className}`
    : `bg-white ${className}`;

  return (
    <div className={containerClass}>
      {children}
    </div>
  );
}