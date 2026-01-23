'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AdminGuardProps {
  children: React.ReactNode;
  userRole?: string; // Роль пользователя, переданная из серверного компонента
}

export default function AdminGuard({ children, userRole }: AdminGuardProps) {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    // Проверяем роль пользователя, переданную из серверного компонента
    if (userRole && (userRole === 'admin' || userRole === 'super_admin')) {
      setHasPermission(true);
    } else {
      // Пользователь не является администратором, перенаправляем на логин
      router.push('/login');
      setHasPermission(false);
    }
  }, [userRole, router]);

  // Показываем контент только если есть разрешение
  if (hasPermission === null) {
    return <div>Проверка сессии...</div>; // Показываем загрузочный индикатор во время проверки
  }

  if (!hasPermission) {
    return null; // Не показываем контент, если нет разрешения
  }

  return <>{children}</>;
}