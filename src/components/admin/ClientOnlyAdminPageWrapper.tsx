'use client';

import { ReactNode, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Динамический импорт AdminSidebar для избежания проблем с гидрацией
const AdminSidebar = dynamic(() => import('@/components/admin/AdminSidebar'), {
  ssr: false
});

interface ClientOnlyAdminPageWrapperProps {
  children: ReactNode;
  username?: string;
  role?: string;
}

export default function ClientOnlyAdminPageWrapper({ children, username, role }: ClientOnlyAdminPageWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Показываем пустой контейнер до монтирования, чтобы избежать гидрации
    return (
      <div className="max-w-6xl mx-auto">
        <div className="animate-pulse space-y-6 invisible">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <AdminSidebar username={username} role={role} />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}