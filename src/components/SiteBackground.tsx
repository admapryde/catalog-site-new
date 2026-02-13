'use client';

import { useEffect, useState } from 'react';

interface SiteBackgroundProps {
  bgImage?: string;
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

export default function SiteBackground({ bgImage }: SiteBackgroundProps) {
  const [bgLoaded, setBgLoaded] = useState(false);
  const optimizedBgImage = bgImage ? getOptimizedImageUrl(bgImage) : undefined;

  useEffect(() => {
    if (optimizedBgImage) {
      // Загружаем изображение для предотвращения мерцания
      const img = new Image();
      img.onload = () => setBgLoaded(true);
      img.onerror = () => setBgLoaded(false);
      img.src = optimizedBgImage;
    } else {
      setBgLoaded(false);
    }
  }, [optimizedBgImage]);

  if (!optimizedBgImage || !bgLoaded) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[-1] w-full h-full"
      style={{
        backgroundImage: `url("${optimizedBgImage}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    />
  );
}