import { NextRequest } from 'next/server';
import { createAPIClient, supabaseWithRetry } from '@/lib/supabase-server';
import { getAdminSessionFromRequest } from '@/services/admin-auth-service';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Create a service role client for admin operations
function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Отсутствуют переменные окружения для Supabase SERVICE ROLE');
  }

  return createSupabaseClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  });
}

export async function PUT(request: NextRequest) {
  try {
    // Проверяем, что пользователь аутентифицирован как администратор
    const adminUser = await getAdminSessionFromRequest(request);
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
      const result = await supabaseWithRetry(supabase, (client) =>
        client
          .from('banners')
          .update({ sort_order: banner.sort_order })
          .eq('id', banner.id)
          .select()
      ) as { data: any; error: any };

      const { data, error } = result;

      if (error) {
        // If it's a permission error, try using service role client
        if (error.code === '42501' || error.message?.includes('permission denied')) {
          console.warn('Permission error detected, using service role client for banner update');
          const serviceRoleClient = createServiceRoleClient();

          const srResult = await serviceRoleClient
            .from('banners')
            .update({ sort_order: banner.sort_order })
            .eq('id', banner.id)
            .select();

          if (srResult.error) {
            throw srResult.error;
          }

          return srResult.data;
        }
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