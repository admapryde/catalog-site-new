'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Компонент для установки темы оформления на основе переданного значения
 */
export default function ThemeProvider({ children, theme }: { children: React.ReactNode, theme: string }) {
  const pathname = usePathname();

  useEffect(() => {
    // Удаляем старые классы тем
    document.documentElement.classList.remove('dark', 'light');

    // Устанавливаем тему в корневой элемент
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      // Для светлой темы не добавляем класс, чтобы использовать оригинальный дизайн
      // по умолчанию (без темной темы)
    }
  }, [theme, pathname]); // Перезапускаем при изменении темы или пути

  return <>{children}</>;
}