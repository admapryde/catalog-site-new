import { NextRequest } from 'next/server';
import { createAPIClient, supabaseWithRetry } from '@/lib/supabase-server';
import { getAdminSession, getAdminSessionFromRequest } from '@/services/admin-auth-service';
import { auditService } from '@/utils/audit-service';
import { cacheManager } from '@/utils/cache-manager';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Кэшируем результаты запросов на 5 минут
const CACHE_DURATION = 5 * 60 * 1000; // 5 минут в миллисекундах

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

export async function GET(request: NextRequest) {
  // Проверяем, что пользователь аутентифицирован как администратор
  const adminUser = await getAdminSession();
  if (!adminUser) {
    return Response.json({ error: 'Требуется аутентификация администратора' }, { status: 401 });
  }

  try {
    // Формируем ключ кэша
    const cacheKey = 'admin_categories';
    const cached = cacheManager.get<any[]>(cacheKey, CACHE_DURATION);

    // Проверяем, есть ли свежие данные в кэше
    if (cached) {
      const response = Response.json(cached);
      response.headers.set('Cache-Control', 'public, max-age=300'); // 5 минут кэширования
      return response;
    }

    // Используем реальный Supabase клиент для API маршрутов
    const supabase = await createAPIClient(request);

    const result = await supabaseWithRetry(supabase, (client) =>
      client
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true })
    ) as { data: any; error: any };

    const { data, error } = result;

    if (error) {
      console.error('Ошибка получения категорий:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Сохраняем результат в кэш
    cacheManager.set(cacheKey, data);

    const response = Response.json(data);
    response.headers.set('Cache-Control', 'public, max-age=300'); // 5 минут кэширования
    return response;
  } catch (error: any) {
    console.error('Ошибка получения категорий:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Проверяем, что пользователь аутентифицирован как администратор
  const adminUser = await getAdminSessionFromRequest(request);
  if (!adminUser) {
    return Response.json({ error: 'Требуется аутентификация администратора' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, image_url, sort_order } = body;

    // Используем реальный Supabase клиент для API маршрутов
    const supabase = await createAPIClient(request);

    const result = await supabaseWithRetry(supabase, (client) =>
      client
        .from('categories')
        .insert([{ name, image_url, sort_order: sort_order || 0 }])
        .select()
    ) as { data: any; error: any };

    const { data, error } = result;

    if (error) {
      // If it's a permission error, try using service role client
      if (error.code === '42501' || error.message?.includes('permission denied')) {
        console.warn('Permission error detected, using service role client for categories POST');
        const serviceRoleClient = createServiceRoleClient();

        const srResult = await serviceRoleClient
          .from('categories')
          .insert([{ name, image_url, sort_order: sort_order || 0 }])
          .select();

        if (srResult.error) {
          return Response.json({ error: srResult.error.message }, { status: 500 });
        }

        // Логируем создание категории в аудите
        try {
          await auditService.logCreate(adminUser.email || 'admin', 'categories', srResult.data?.[0]?.id, adminUser.id);
        } catch (auditError) {
          console.error('Ошибка записи в аудит при создании категории:', auditError);
        }

        // Инвалидируем кэш для админ панели категорий
        try {
          cacheManager.delete('admin_categories');
        } catch (cacheError) {
          console.error('Ошибка инвалидации кэша админ панели категорий:', cacheError);
        }

        return Response.json(srResult.data);
      }

      return Response.json({ error: error.message }, { status: 500 });
    }

    // Логируем создание категории в аудите
    try {
      await auditService.logCreate(adminUser.email || 'admin', 'categories', data?.[0]?.id, adminUser.id);
    } catch (auditError) {
      console.error('Ошибка записи в аудит при создании категории:', auditError);
    }

    // Инвалидируем кэш для админ панели категорий
    try {
      cacheManager.delete('admin_categories');
    } catch (cacheError) {
      console.error('Ошибка инвалидации кэша админ панели категорий:', cacheError);
    }

    return Response.json(data);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  // Проверяем, что пользователь аутентифицирован как администратор
  const adminUser = await getAdminSessionFromRequest(request);
  if (!adminUser) {
    return Response.json({ error: 'Требуется аутентификация администратора' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, image_url, sort_order } = body;

    // Используем реальный Supabase клиент для API маршрутов
    const supabase = await createAPIClient(request);

    const result = await supabaseWithRetry(supabase, (client) =>
      client
        .from('categories')
        .update({ name, image_url, sort_order })
        .eq('id', id)
        .select()
    ) as { data: any; error: any };

    const { data, error } = result;

    if (error) {
      // If it's a permission error, try using service role client
      if (error.code === '42501' || error.message?.includes('permission denied')) {
        console.warn('Permission error detected, using service role client for categories update');
        const serviceRoleClient = createServiceRoleClient();

        const srResult = await serviceRoleClient
          .from('categories')
          .update({ name, image_url, sort_order })
          .eq('id', id)
          .select();

        if (srResult.error) {
          return Response.json({ error: srResult.error.message }, { status: 500 });
        }

        // Логируем обновление категории в аудите
        try {
          await auditService.logUpdate(adminUser.email || 'admin', 'categories', id, adminUser.id);
        } catch (auditError) {
          console.error('Ошибка записи в аудит при обновлении категории:', auditError);
        }

        // Инвалидируем кэш для админ панели категорий
        try {
          cacheManager.delete('admin_categories');
        } catch (cacheError) {
          console.error('Ошибка инвалидации кэша админ панели категорий:', cacheError);
        }

        return Response.json(srResult.data);
      }

      return Response.json({ error: error.message }, { status: 500 });
    }

    // Логируем обновление категории в аудите
    try {
      await auditService.logUpdate(adminUser.email || 'admin', 'categories', id, adminUser.id);
    } catch (auditError) {
      console.error('Ошибка записи в аудит при обновлении категории:', auditError);
    }

    // Инвалидируем кэш для админ панели категорий
    try {
      cacheManager.delete('admin_categories');
    } catch (cacheError) {
      console.error('Ошибка инвалидации кэша админ панели категорий:', cacheError);
    }

    return Response.json(data);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

import { deleteImageFromCloudinaryByUrl } from '@/utils/cloudinary-helpers';

export async function DELETE(request: NextRequest) {
  // Проверяем, что пользователь аутентифицирован как администратор
  const adminUser = await getAdminSessionFromRequest(request);
  if (!adminUser) {
    return Response.json({ error: 'Требуется аутентификация администратора' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({ error: 'ID категории не указан' }, { status: 400 });
    }

    // Используем реальный Supabase клиент для API маршрутов
    const supabase = await createAPIClient(request);

    // Получаем информацию о категории перед удалением для возможной очистки изображения из Cloudinary
    const fetchResult = await supabaseWithRetry(supabase, (client) =>
      client
        .from('categories')
        .select('image_url')
        .eq('id', id)
        .single()
    ) as { data: any; error: any };

    const { data: categoryToDelete, error: fetchError } = fetchResult;

    if (fetchError) {
      // If it's a permission error, try using service role client
      if (fetchError.code === '42501' || fetchError.message?.includes('permission denied')) {
        console.warn('Permission error detected, using service role client for category fetch before deletion');
        const serviceRoleClient = createServiceRoleClient();

        const srFetchResult = await serviceRoleClient
          .from('categories')
          .select('image_url')
          .eq('id', id)
          .single();

        if (srFetchResult.error) {
          console.error('Ошибка получения информации о категории перед удалением через service role:', srFetchResult.error);
        } else {
          const srCategoryToDelete = srFetchResult.data;
          if (srCategoryToDelete?.image_url) {
            // Удаляем изображение категории из Cloudinary
            await deleteImageFromCloudinaryByUrl(srCategoryToDelete.image_url);
          }
        }
      } else {
        console.error('Ошибка получения информации о категории перед удалением:', fetchError);
      }
    } else if (categoryToDelete?.image_url) {
      // Удаляем изображение категории из Cloudinary
      await deleteImageFromCloudinaryByUrl(categoryToDelete.image_url);
    }

    // Удаляем категорию (каскадно удалятся связанные продукты)
    const deleteResult = await supabaseWithRetry(supabase, (client) =>
      client
        .from('categories')
        .delete()
        .eq('id', id)
    ) as { data: any; error: any };

    const { error: deleteError } = deleteResult;

    if (deleteError) {
      // If it's a permission error, try using service role client
      if (deleteError.code === '42501' || deleteError.message?.includes('permission denied')) {
        console.warn('Permission error detected, using service role client for categories DELETE');
        const serviceRoleClient = createServiceRoleClient();

        const srDeleteResult = await serviceRoleClient
          .from('categories')
          .delete()
          .eq('id', id);

        if (srDeleteResult.error) {
          return Response.json({ error: srDeleteResult.error.message }, { status: 500 });
        }

        // Логируем удаление категории в аудите
        try {
          await auditService.logDelete(adminUser.email || 'admin', 'categories', id, adminUser.id);
        } catch (auditError) {
          console.error('Ошибка записи в аудит при удалении категории:', auditError);
        }

        // Инвалидируем кэш для админ панели категорий
        try {
          cacheManager.delete('admin_categories');
        } catch (cacheError) {
          console.error('Ошибка инвалидации кэша админ панели категорий:', cacheError);
        }

        // Также инвалидируем кэш для админ панели товаров, так как при удалении категории удаляются связанные продукты
        try {
          cacheManager.delete('admin_products_all');
          cacheManager.delete(`admin_products_${id}`); // Удаляем кэш товаров для конкретной категории
        } catch (cacheError) {
          console.error('Ошибка инвалидации кэша админ панели товаров:', cacheError);
        }

        return Response.json({ success: true });
      }

      return Response.json({ error: deleteError.message }, { status: 500 });
    }

    // Логируем удаление категории в аудите
    try {
      await auditService.logDelete(adminUser.email || 'admin', 'categories', id, adminUser.id);
    } catch (auditError) {
      console.error('Ошибка записи в аудит при удалении категории:', auditError);
    }

    // Инвалидируем кэш для админ панели категорий
    try {
      cacheManager.delete('admin_categories');
    } catch (cacheError) {
      console.error('Ошибка инвалидации кэша админ панели категорий:', cacheError);
    }

    // Также инвалидируем кэш для админ панели товаров, так как при удалении категории удаляются связанные продукты
    try {
      cacheManager.delete('admin_products_all');
      cacheManager.delete(`admin_products_${id}`); // Удаляем кэш товаров для конкретной категории
    } catch (cacheError) {
      console.error('Ошибка инвалидации кэша админ панели товаров:', cacheError);
    }

    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}