'use client';

import { useEffect } from 'react';

interface BackgroundSetterProps {
  bgImage?: string;
}

export default function BackgroundSetter({ bgImage }: BackgroundSetterProps) {
  useEffect(() => {
    if (bgImage) {
      document.documentElement.style.setProperty('--body-bg', 'transparent');
    } else {
      document.documentElement.style.setProperty('--body-bg', 'var(--background, #ffffff)');
    }

    // Очищаем переменные при размонтировании
    return () => {
      document.documentElement.style.setProperty('--body-bg', 'var(--background, #ffffff)');
    };
  }, [bgImage]);

  return null; // Этот компонент не рендерит ничего
}