import { NextRequest, NextResponse } from 'next/server';
import { mockSessionManager } from '@/lib/mock-auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // В реальной системе здесь будет проверка учетных данных через Supabase Auth
    // Пока используем упрощенную проверку с фиксированными учетными данными

    // Проверяем, являются ли учетные данные допустимыми
    // В реальной системе здесь будет вызов Supabase Auth API
    if (email === 'admin@example.com' && password === 'admin123') {
      // Создаем сессию
      const sessionId = mockSessionManager.createSession(email);

      // Создаем ответ
      const response = NextResponse.json({
        ok: true,
        url: '/admin'
      });

      // Устанавливаем куки через NextResponse
      response.cookies.set('mock_session_id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60, // 24 часа
        path: '/',
        sameSite: 'strict',
      });

      return response;
    } else {
      return NextResponse.json(
        { ok: false, error: 'Неверные учетные данные' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Ошибка входа:', error);
    return NextResponse.json(
      { ok: false, error: 'Произошла ошибка при входе' },
      { status: 500 }
    );
  }
}