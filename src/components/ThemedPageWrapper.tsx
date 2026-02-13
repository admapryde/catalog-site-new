'use client';

import { ReactNode, useState, useEffect } from 'react';

interface GeneralSettings {
  bg_image?: string;
}

// Функция для оптимизации URL изображения из Cloudinary
const getOptimizedImageUrl = (url: string): string => {
  if (!url || !url.includes('res.cloudinary.com')) {
    return url; // Возвращаем оригинальный URL, если это не Cloudinary
  }

  // Разбиваем URL на части
  const urlParts = url.split('/');
  
  // Находим индекс, где начинается путь к изображению (обычно после /upload/)
  const uploadIndex = urlParts.findIndex(part => part === 'upload');
  
  if (uploadIndex !== -1) {
    // Создаем параметры оптимизации: автоформат, качество 80, ширина 1920px
    const transformationParams = 'f_auto,q_80,w_1920,c_limit';
    
    // Вставляем параметры оптимизации после /upload/
    urlParts.splice(uploadIndex + 1, 0, transformationParams);
    
    return urlParts.join('/');
  }
  
  return url;
};

export default function ThemedPageWrapper({ children }: { children: ReactNode }) {
  const [bgImage, setBgImage] = useState<string | undefined>(undefined);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/general-settings');
        if (response.ok) {
          const settings: GeneralSettings = await response.json();
          // Оптимизируем URL фонового изображения
          const optimizedBgImage = settings.bg_image ? getOptimizedImageUrl(settings.bg_image) : undefined;
          setBgImage(optimizedBgImage);
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