import { NextRequest, NextResponse } from 'next/server';
import { destroyAdminSession } from '@/services/admin-auth-service';

export async function POST(request: NextRequest) {
  try {
    // Уничтожаем сессию администратора
    await destroyAdminSession();

    // Возвращаем успешный ответ
    return NextResponse.json({
      ok: true,
      url: '/login'
    });
  } catch (error) {
    console.error('Ошибка выхода администратора:', error);
    return NextResponse.json(
      { ok: false, error: 'Произошла ошибка при выходе' },
      { status: 500 }
    );
  }
}