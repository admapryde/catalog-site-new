import { NextRequest } from 'next/server';
import { createAPIClient, supabaseWithRetry } from '@/lib/supabase-server';
import { getAdminSession } from '@/services/admin-auth-service';

export async function PUT(request: NextRequest) {
  try {
    // Проверяем, что пользователь аутентифицирован как администратор
    const adminUser = await getAdminSession();
    if (!adminUser) {
      return Response.json({ error: 'Требуется аутентификация администратора' }, { status: 401 });
    }

    const body = await request.json();
    const { groups } = body;

    if (!Array.isArray(groups)) {
      return Response.json({ error: 'Неверный формат данных' }, { status: 400 });
    }

    // Проверяем, что все элементы содержат необходимые поля
    for (const group of groups) {
      if (!group.id || typeof group.position !== 'number') {
        return Response.json({ error: 'Неверный формат данных группы' }, { status: 400 });
      }
    }

    // Используем реальный Supabase клиент для API маршрутов
    const supabase = await createAPIClient(request);

    // Обновляем порядок групп в базе данных
    const updates = groups.map(async (group) => {
      const { data, error } = await supabase
        .from('banner_groups')
        .update({ position: group.position })
        .eq('id', group.id);

      if (error) {
        throw error;
      }

      return data;
    });

    try {
      await Promise.all(updates);
    } catch (error: any) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error: any) {
    console.error('Ошибка при обновлении порядка групп баннеров:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}