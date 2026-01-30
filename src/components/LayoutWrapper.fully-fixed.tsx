'use client';

import { ReactNode, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Динамический импорт компонентов для избежания проблем с гидрацией
const Footer = dynamic(() => import('@/components/FooterWrapper'), {
  ssr: false,
  loading: () => (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="animate-pulse">
            <h3 className="text-lg font-semibold mb-4 text-left h-6 bg-gray-600 rounded"></h3>
            <p className="text-gray-300 h-4 bg-gray-600 rounded mb-2"></p>
            <p className="text-gray-300 h-4 bg-gray-600 rounded w-3/4"></p>
          </div>
          <div className="animate-pulse">
            <h3 className="text-lg font-semibold mb-4 text-left h-6 bg-gray-600 rounded"></h3>
            <ul className="space-y-2 text-gray-300">
              <li className="h-4 bg-gray-600 rounded"></li>
              <li className="h-4 bg-gray-600 rounded"></li>
              <li className="h-4 bg-gray-600 rounded w-4/5"></li>
            </ul>
          </div>
          <div className="animate-pulse">
            <h3 className="text-lg font-semibold mb-4 text-left h-6 bg-gray-600 rounded"></h3>
            <ul className="space-y-2">
              <li className="h-4 bg-gray-600 rounded"></li>
              <li className="h-4 bg-gray-600 rounded"></li>
              <li className="h-4 bg-gray-600 rounded w-3/4"></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-400">
          <p className="h-4 bg-gray-600 rounded w-1/2 mx-auto"></p>
        </div>
      </div>
    </footer>
  )
});

const SiteBackground = dynamic(() => import('./SiteBackground'), {
  ssr: false
});

const BackgroundSetter = dynamic(() => import('./BackgroundSetter'), {
  ssr: false
});

// Импортируем HeaderWrapper как обычный компонент
import HeaderWrapper from '@/components/HeaderWrapper';
import MobileBottomNav from '@/components/MobileBottomNav';

interface GeneralSettings {
  bg_image?: string;
}

export default function LayoutWrapper({ children }: { children: ReactNode }) {
  const [bgImage, setBgImage] = useState<string | undefined>(undefined);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    // Только на клиенте обновляем состояние и класс
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/general-settings');
        if (response.ok) {
          const settings: GeneralSettings = await response.json();
          setBgImage(settings.bg_image);
        } else {
          // Если не удалось получить настройки, не устанавливаем bgImage
          setBgImage(undefined);
        }
      } catch (error) {
        console.error('Ошибка загрузки настроек:', error);
        // В случае ошибки не устанавливаем bgImage
        setBgImage(undefined);
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

  // Используем bg-white как fallback на сервере и клиенте до тех пор, пока не определим bgImage
  // После гидрации и получения bgImage, класс может измениться, но это нормально, так как
  // мы используем динамические компоненты, которые не рендерятся на сервере
  const effectiveMainClass = `flex-grow ${bgImage ? 'bg-transparent' : 'bg-white'}`;

  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0">
      {/* Показываем SiteBackground только на клиенте, чтобы избежать гидрации */}
      {isClient && <SiteBackground bgImage={bgImage} />}
      {/* BackgroundSetter также рендерится только на клиенте */}
      {isClient && <BackgroundSetter bgImage={bgImage} />}
      <HeaderWrapper />
      <main className={effectiveMainClass}>
        {children}
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}