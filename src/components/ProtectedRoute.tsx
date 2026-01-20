// src/components/ProtectedRoute.tsx
'use server';

import { redirect } from 'next/navigation';
import { getAdminSession } from '@/services/admin-auth-service';

export async function requireAdminSession() {
  const user = await getAdminSession();

  if (!user) {
    // Нет сессии, перенаправляем на логин
    redirect('/login');
  }
}