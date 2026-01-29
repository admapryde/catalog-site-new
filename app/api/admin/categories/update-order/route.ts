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
    const { categories } = body;

    if (!Array.isArray(categories)) {
      return Response.json({ error: 'Неверный формат данных' }, { status: 400 });
    }

    // Проверяем, что все элементы содержат необходимые поля
    for (const category of categories) {
      if (!category.id || typeof category.sort_order !== 'number') {
        return Response.json({ error: 'Неверный формат данных категории' }, { status: 400 });
      }
    }

    // Используем реальный Supabase клиент для API маршрутов
    const supabase = await createAPIClient(request);

    // Обновляем порядок категорий в базе данных
    const updates = categories.map(async (category) => {
      const { data, error } = await supabase
        .from('categories')
        .update({ sort_order: category.sort_order })
        .eq('id', category.id);

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
    console.error('Ошибка при обновлении порядка категорий:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}