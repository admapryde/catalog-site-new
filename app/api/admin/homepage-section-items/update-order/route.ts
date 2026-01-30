import { NextRequest } from 'next/server';
import { createAPIClient, supabaseWithRetry } from '@/lib/supabase-server';
import { getAdminSession } from '@/services/admin-auth-service';
import { createClient } from '@supabase/supabase-js';

// Create a service role client for admin operations
function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Отсутствуют переменные окружения для Supabase SERVICE ROLE');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  });
}

export async function PUT(request: NextRequest) {
  try {
    // Проверяем, что пользователь аутентифицирован как администратор
    const adminUser = await getAdminSession();
    if (!adminUser) {
      return Response.json({ error: 'Требуется аутентификация администратора' }, { status: 401 });
    }

    const body = await request.json();
    const { items } = body;

    if (!Array.isArray(items)) {
      return Response.json({ error: 'Неверный формат данных' }, { status: 400 });
    }

    // Проверяем, что все элементы содержат необходимые поля
    for (const item of items) {
      if (!item.id || typeof item.sort_order !== 'number' || !item.section_id) {
        return Response.json({ error: 'Неверный формат данных элемента' }, { status: 400 });
      }
    }

    // Используем реальный Supabase клиент для API маршрутов
    const supabase = await createAPIClient(request);

    // Обновляем порядок элементов в базе данных
    const updates = items.map(async (item) => {
      const { data, error } = await supabase
        .from('homepage_section_items')
        .update({ sort_order: item.sort_order })
        .eq('id', item.id);

      if (error) {
        // If it's a permission error, try using service role client
        if (error.code === '42501' || error.message?.includes('permission denied')) {
          console.warn('Permission error detected, using service role client for homepage section items update');
          const serviceRoleClient = createServiceRoleClient();

          const { data: srData, error: srError } = await serviceRoleClient
            .from('homepage_section_items')
            .update({ sort_order: item.sort_order })
            .eq('id', item.id);

          if (srError) {
            throw srError;
          }

          return srData;
        } else {
          throw error;
        }
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
    console.error('Ошибка при обновлении порядка элементов разделов:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}