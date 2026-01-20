'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser-client';

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Проверяем сессию администратора через Supabase Auth
    const checkAdminSession = async () => {
      try {
        const supabase = createSupabaseBrowserClient();

        const { data: { session }, error } = await supabase.auth.getSession();

        console.log('AdminGuard: getSession result', { session, error });

        if (error || !session) {
          console.log('AdminGuard: No session or error, redirecting to login');
          // Нет сессии, перенаправляем на логин
          router.push('/login');
          return;
        }

        // Проверяем, что пользователь является администратором
        const userRole = session.user.user_metadata?.role || 'user';
        console.log('AdminGuard: User role from metadata:', userRole);

        if (userRole !== 'admin' && userRole !== 'super_admin') {
          console.log('AdminGuard: User is not an admin, redirecting to login');
          // Пользователь не является администратором, перенаправляем на логин
          router.push('/login');
          return;
        }

        // Пропускаем проверку времени жизни сессии в браузерном клиенте
        // Время жизни сессии проверяется на сервере

        console.log('AdminGuard: Session is valid, allowing access');
        // Сессия валидна, проверка пройдена
        setChecked(true);
      } catch (e) {
        console.error('Ошибка проверки сессии администратора:', e);
        // Ошибка проверки сессии, перенаправляем на логин
        router.push('/login');
        return;
      } finally {
        setLoading(false);
      }
    };

    checkAdminSession();
  }, [router]);

  // Показываем контент только после проверки сессии
  // Пока проверка не завершена, можно показать загрузочный индикатор
  if (loading || !checked) {
    return <div>Проверка сессии...</div>; // Можно заменить на спиннер
  }

  return <>{children}</>;
}