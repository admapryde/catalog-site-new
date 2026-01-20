import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Ошибка при аутентификации через Supabase:', error);
      return Response.json({ error: 'Неверные учетные данные' }, { status: 401 });
    }

    // При успешной аутентификации токены будут автоматически сохранены в куки
    // благодаря настройкам Supabase клиента в файле lib/supabase-server.ts

    return Response.json({
      success: true,
      user: {
        id: data.user?.id,
        email: data.user?.email,
        role: data.user?.user_metadata?.role || 'user'
      }
    });
  } catch (error) {
    console.error('Ошибка при обработке логина:', error);
    return Response.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}