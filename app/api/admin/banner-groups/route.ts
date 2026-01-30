import { NextRequest } from 'next/server';
import { createAPIClient, supabaseWithRetry } from '@/lib/supabase-server';
import { getAdminSessionFromRequest } from '@/services/admin-auth-service';
import { auditService } from '@/utils/audit-service';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Получение всех групп баннеров с баннерами
export async function GET(request: NextRequest) {
  try {
    // Используем реальный Supabase клиент для API маршрутов
    const supabase = await createAPIClient(request);

    const result = await supabaseWithRetry(supabase, (client) =>
      client
        .from('banner_groups')
        .select(`
          *,
          banners(*)
        `)
        .order('position', { ascending: true })
    ) as { data: any; error: any };

    const { data, error } = result;

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

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

// Создание новой группы баннеров
export async function POST(request: NextRequest) {
  // Проверяем, что пользователь аутентифицирован как администратор
  const adminUser = await getAdminSessionFromRequest(request);
  if (!adminUser) {
    return Response.json({ error: 'Требуется аутентификация администратора' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, position } = body;

    // Используем реальный Supabase клиент для API маршрутов
    const supabase = await createAPIClient(request);

    const result = await supabaseWithRetry(supabase, (client) =>
      client
        .from('banner_groups')
        .insert([{ title, position }])
        .select()
    ) as { data: any; error: any };

    const { data, error } = result;

    if (error) {
      // If it's a permission error, try using service role client
      if (error.code === '42501' || error.message?.includes('permission denied')) {
        console.warn('Permission error detected, using service role client for banner groups POST');
        const serviceRoleClient = createServiceRoleClient();

        const srResult = await serviceRoleClient
          .from('banner_groups')
          .insert([{ title, position }])
          .select();

        if (srResult.error) {
          return Response.json({ error: srResult.error.message }, { status: 500 });
        }

        // Логируем создание группы баннеров в аудите
        try {
          await auditService.logCreate(adminUser.email || 'admin', 'banner_groups', srResult.data?.[0]?.id, adminUser.id);
        } catch (auditError) {
          console.error('Ошибка записи в аудит при создании группы баннеров:', auditError);
        }

        return Response.json(srResult.data);
      }

      return Response.json({ error: error.message }, { status: 500 });
    }

    // Логируем создание группы баннеров в аудите
    try {
      await auditService.logCreate(adminUser.email || 'admin', 'banner_groups', data?.[0]?.id, adminUser.id);
    } catch (auditError) {
      console.error('Ошибка записи в аудит при создании группы баннеров:', auditError);
    }

    /*
    // Инвалидируем кэш для баннеров на главной странице
    try {
      const { revalidateTag, revalidatePath } = await import('next/cache');
      await Promise.allSettled([
        revalidateTag('homepage_banners'),
        revalidatePath('/'),
        revalidatePath('/api/banners')
      ]);
    } catch (cacheError) {
      console.error('Ошибка инвалидации кэша баннеров:', cacheError);
    }
    */

    return Response.json(data);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// Обновление группы баннеров
export async function PUT(request: NextRequest) {
  // Проверяем, что пользователь аутентифицирован как администратор
  const adminUser = await getAdminSessionFromRequest(request);
  if (!adminUser) {
    return Response.json({ error: 'Требуется аутентификация администратора' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, title, position } = body;

    // Используем реальный Supabase клиент для API маршрутов
    const supabase = await createAPIClient(request);

    const result = await supabaseWithRetry(supabase, (client) =>
      client
        .from('banner_groups')
        .update({ title, position })
        .eq('id', id)
        .select()
    ) as { data: any; error: any };

    const { data, error } = result;

    if (error) {
      // If it's a permission error, try using service role client
      if (error.code === '42501' || error.message?.includes('permission denied')) {
        console.warn('Permission error detected, using service role client for banner groups update');
        const serviceRoleClient = createServiceRoleClient();

        const srResult = await serviceRoleClient
          .from('banner_groups')
          .update({ title, position })
          .eq('id', id)
          .select();

        if (srResult.error) {
          return Response.json({ error: srResult.error.message }, { status: 500 });
        }

        // Логируем обновление группы баннеров в аудите
        try {
          await auditService.logUpdate(adminUser.email || 'admin', 'banner_groups', id, adminUser.id);
        } catch (auditError) {
          console.error('Ошибка записи в аудит при обновлении группы баннеров:', auditError);
        }

        return Response.json(srResult.data);
      }

      return Response.json({ error: error.message }, { status: 500 });
    }

    // Логируем обновление группы баннеров в аудите
    try {
      await auditService.logUpdate(adminUser.email || 'admin', 'banner_groups', id, adminUser.id);
    } catch (auditError) {
      console.error('Ошибка записи в аудит при обновлении группы баннеров:', auditError);
    }

    /*
    // Инвалидируем кэш для баннеров на главной странице
    try {
      const { revalidateTag, revalidatePath } = await import('next/cache');
      await Promise.allSettled([
        revalidateTag('homepage_banners'),
        revalidatePath('/'),
        revalidatePath('/api/banners')
      ]);
    } catch (cacheError) {
      console.error('Ошибка инвалидации кэша баннеров:', cacheError);
    }
    */

    return Response.json(data);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

import { deleteImageFromCloudinaryByUrl } from '@/utils/cloudinary-helpers';

// Удаление группы баннеров
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
      return Response.json({ error: 'ID группы баннеров не указан' }, { status: 400 });
    }

    // Используем реальный Supabase клиент для API маршрутов
    const supabase = await createAPIClient(request);

    // Получаем все баннеры, связанные с этой группой, для удаления их изображений из Cloudinary
    const bannersFetchResult = await supabaseWithRetry(supabase, (client) =>
      client
        .from('banners')
        .select('image_url')
        .eq('group_id', id)
    ) as { data: any; error: any };

    const { data: bannersToDelete, error: bannersFetchError } = bannersFetchResult;

    if (bannersFetchError) {
      // If it's a permission error, try using service role client
      if (bannersFetchError.code === '42501' || bannersFetchError.message?.includes('permission denied')) {
        console.warn('Permission error detected, using service role client for banner fetch before group deletion');
        const serviceRoleClient = createServiceRoleClient();

        const srBannersResult = await serviceRoleClient
          .from('banners')
          .select('image_url')
          .eq('group_id', id);

        if (srBannersResult.error) {
          console.error('Ошибка получения баннеров перед удалением группы через service role:', srBannersResult.error);
        } else {
          const srBannersToDelete = srBannersResult.data;
          // Удаляем изображения всех баннеров из Cloudinary
          for (const banner of srBannersToDelete || []) {
            if (banner.image_url) {
              await deleteImageFromCloudinaryByUrl(banner.image_url);
            }
          }
        }
      } else {
        console.error('Ошибка получения баннеров перед удалением группы:', bannersFetchError);
      }
    } else {
      // Удаляем изображения всех баннеров из Cloudinary
      for (const banner of bannersToDelete || []) {
        if (banner.image_url) {
          await deleteImageFromCloudinaryByUrl(banner.image_url);
        }
      }
    }

    // Удаляем группу баннеров (каскадно удалятся связанные баннеры)
    const deleteResult = await supabaseWithRetry(supabase, (client) =>
      client
        .from('banner_groups')
        .delete()
        .eq('id', id)
    ) as { data: any; error: any };

    const { error } = deleteResult;

    if (error) {
      // If it's a permission error, try using service role client
      if (error.code === '42501' || error.message?.includes('permission denied')) {
        console.warn('Permission error detected, using service role client for banner groups DELETE');
        const serviceRoleClient = createServiceRoleClient();

        const srDeleteResult = await serviceRoleClient
          .from('banner_groups')
          .delete()
          .eq('id', id);

        if (srDeleteResult.error) {
          return Response.json({ error: srDeleteResult.error.message }, { status: 500 });
        }

        // Логируем удаление группы баннеров в аудите
        try {
          await auditService.logDelete(adminUser.email || 'admin', 'banner_groups', id, adminUser.id);
        } catch (auditError) {
          console.error('Ошибка записи в аудит при удалении группы баннеров:', auditError);
        }

        return Response.json({ success: true });
      }

      return Response.json({ error: error.message }, { status: 500 });
    }

    // Логируем удаление группы баннеров в аудите
    try {
      await auditService.logDelete(adminUser.email || 'admin', 'banner_groups', id, adminUser.id);
    } catch (auditError) {
      console.error('Ошибка записи в аудит при удалении группы баннеров:', auditError);
    }

    /*
    // Инвалидируем кэш для баннеров на главной странице
    try {
      const { revalidateTag, revalidatePath } = await import('next/cache');
      await Promise.allSettled([
        revalidateTag('homepage_banners'),
        revalidatePath('/'),
        revalidatePath('/api/banners')
      ]);
    } catch (cacheError) {
      console.error('Ошибка инвалидации кэша баннеров:', cacheError);
    }
    */

    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}