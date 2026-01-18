'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();

  useEffect(() => {
    // Проверяем сессию администратора
    const checkAdminSession = () => {
      try {
        const adminSessionCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('admin_session='));
        
        if (!adminSessionCookie) {
          // Нет сессии, перенаправляем на логин
          router.push('/login');
          return;
        }

        const sessionData = JSON.parse(decodeURIComponent(adminSessionCookie.split('=')[1]));
        
        if (!sessionData.userId || !sessionData.username) {
          // Некорректная сессия, перенаправляем на логин
          router.push('/login');
          return;
        }

        // Проверяем время жизни сессии (24 часа)
        const sessionAge = Date.now() - sessionData.timestamp;
        if (sessionAge > 24 * 60 * 60 * 1000) { // 24 часа в миллисекундах
          // Сессия истекла, перенаправляем на логин
          router.push('/login');
          return;
        }
      } catch (e) {
        console.error('Ошибка проверки сессии администратора:', e);
        // Ошибка разбора сессии, перенаправляем на логин
        router.push('/login');
        return;
      }
    };

    checkAdminSession();
  }, [router]);

  // Показываем контент только после проверки сессии
  // В реальном приложении здесь может быть загрузочный индикатор
  return <>{children}</>;
}