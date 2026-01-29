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
    const { banners } = body;

    if (!Array.isArray(banners)) {
      return Response.json({ error: 'Неверный формат данных' }, { status: 400 });
    }

    // Проверяем, что все элементы содержат необходимые поля
    for (const banner of banners) {
      if (!banner.id || typeof banner.sort_order !== 'number' || !banner.group_id) {
        return Response.json({ error: 'Неверный формат данных баннера' }, { status: 400 });
      }
    }

    // Используем реальный Supabase клиент для API маршрутов
    const supabase = await createAPIClient(request);

    // Обновляем порядок баннеров в базе данных
    const updates = banners.map(async (banner) => {
      const { data, error } = await supabase
        .from('banners')
        .update({ sort_order: banner.sort_order })
        .eq('id', banner.id);

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
    console.error('Ошибка при обновлении порядка баннеров:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}