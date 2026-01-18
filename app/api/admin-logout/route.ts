import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Создаем ответ
    const response = NextResponse.json({
      ok: true,
      url: '/login'
    });

    // Удаляем куки сессии администратора
    response.cookies.delete('admin_session');

    return response;
  } catch (error) {
    console.error('Ошибка выхода администратора:', error);
    return NextResponse.json(
      { ok: false, error: 'Произошла ошибка при выходе' },
      { status: 500 }
    );
  }
}