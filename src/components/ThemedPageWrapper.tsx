'use client';

import { ReactNode, useState, useEffect } from 'react';

interface GeneralSettings {
  bg_image?: string;
}

export default function ThemedPageWrapper({ children }: { children: ReactNode }) {
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

  // Если bgImage есть, применяем стиль фона
  const pageStyle = bgImage ? { 
    backgroundImage: `url("${bgImage}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    minHeight: '100vh'
  } : {};

  return (
    <div style={pageStyle} className={bgImage ? 'bg-transparent' : ''}>
      <div className={bgImage ? 'bg-white bg-opacity-85' : 'bg-white'}>
        {children}
      </div>
    </div>
  );
}