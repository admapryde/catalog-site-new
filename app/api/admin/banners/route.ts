import { NextRequest } from 'next/server';
import { createAPIClient, supabaseWithRetry } from '@/lib/supabase-server';
import { auditService } from '@/utils/audit-service';
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

// Получение всех баннеров
export async function GET(request: NextRequest) {
  try {
    // Используем реальный Supabase клиент для API маршрутов
    const supabase = await createAPIClient(request);

    const result = await supabaseWithRetry(supabase, (client) =>
      client
        .from('banners')
        .select(`
          *,
          banner_group:banner_groups(title)
        `)
        .order('sort_order', { ascending: true })
    ) as { data: any; error: any };

    const { data, error } = result;

    if (error) {
      // If it's a permission error, try using service role client
      if (error.code === '42501' || error.message?.includes('permission denied')) {
        console.warn('Permission error detected, using service role client for banners GET');
        const serviceRoleClient = createServiceRoleClient();

        const srResult = await serviceRoleClient
          .from('banners')
          .select(`
            *,
            banner_group:banner_groups(title)
          `)
          .order('sort_order', { ascending: true });

        if (srResult.error) {
          return Response.json({ error: srResult.error.message }, { status: 500 });
        }

        return Response.json(srResult.data);
      }

      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// Создание нового баннера
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { group_id, image_url, link_url, sort_order } = body;

    // Используем реальный Supabase клиент для API маршрутов
    const supabase = await createAPIClient(request);

    const result = await supabaseWithRetry(supabase, (client) =>
      client
        .from('banners')
        .insert([{ group_id, image_url, link_url, sort_order }])
        .select()
    ) as { data: any; error: any };

    const { data, error } = result;

    if (error) {
      // If it's a permission error, try using service role client
      if (error.code === '42501' || error.message?.includes('permission denied')) {
        console.warn('Permission error detected, using service role client for banners POST');
        const serviceRoleClient = createServiceRoleClient();

        const srResult = await serviceRoleClient
          .from('banners')
          .insert([{ group_id, image_url, link_url, sort_order }])
          .select();

        if (srResult.error) {
          return Response.json({ error: srResult.error.message }, { status: 500 });
        }

        // Логируем создание баннера в аудите
        try {
          await auditService.logCreate('admin', 'banners', srResult.data?.[0]?.id);
        } catch (auditError) {
          console.error('Ошибка записи в аудит при создании баннера:', auditError);
        }

        return Response.json(srResult.data);
      }

      return Response.json({ error: error.message }, { status: 500 });
    }

    // Логируем создание баннера в аудите
    try {
      await auditService.logCreate('admin', 'banners', data?.[0]?.id);
    } catch (auditError) {
      console.error('Ошибка записи в аудит при создании баннера:', auditError);
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

// Обновление баннера
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, group_id, image_url, link_url, sort_order } = body;

    // Используем реальный Supabase клиент для API маршрутов
    const supabase = await createAPIClient(request);

    const result = await supabaseWithRetry(supabase, (client) =>
      client
        .from('banners')
        .update({ group_id, image_url, link_url, sort_order })
        .eq('id', id)
        .select()
    ) as { data: any; error: any };

    const { data, error } = result;

    if (error) {
      // If it's a permission error, try using service role client
      if (error.code === '42501' || error.message?.includes('permission denied')) {
        console.warn('Permission error detected, using service role client for banners PUT');
        const serviceRoleClient = createServiceRoleClient();

        const srResult = await serviceRoleClient
          .from('banners')
          .update({ group_id, image_url, link_url, sort_order })
          .eq('id', id)
          .select();

        if (srResult.error) {
          return Response.json({ error: srResult.error.message }, { status: 500 });
        }

        // Логируем обновление баннера в аудите
        try {
          await auditService.logUpdate('admin', 'banners', id);
        } catch (auditError) {
          console.error('Ошибка записи в аудит при обновлении баннера:', auditError);
        }

        return Response.json(srResult.data);
      }

      return Response.json({ error: error.message }, { status: 500 });
    }

    // Логируем обновление баннера в аудите
    try {
      await auditService.logUpdate('admin', 'banners', id);
    } catch (auditError) {
      console.error('Ошибка записи в аудит при обновлении баннера:', auditError);
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

// Удаление баннера
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({ error: 'ID баннера не указан' }, { status: 400 });
    }

    // Используем реальный Supabase клиент для API маршрутов
    const supabase = await createAPIClient(request);

    // Получаем информацию о баннере перед удалением для возможной очистки изображения из Cloudinary
    const fetchResult = await supabaseWithRetry(supabase, (client) =>
      client
        .from('banners')
        .select('image_url')
        .eq('id', id)
        .single()
    ) as { data: any; error: any };

    const { data: bannerToDelete, error: fetchError } = fetchResult;

    if (fetchError) {
      // If it's a permission error, try using service role client
      if (fetchError.code === '42501' || fetchError.message?.includes('permission denied')) {
        console.warn('Permission error detected, using service role client for banner fetch before deletion');
        const serviceRoleClient = createServiceRoleClient();

        const srFetchResult = await serviceRoleClient
          .from('banners')
          .select('image_url')
          .eq('id', id)
          .single();

        if (srFetchResult.error) {
          console.error('Ошибка получения информации о баннере перед удалением через service role:', srFetchResult.error);
        } else {
          const srBannerToDelete = srFetchResult.data;
          if (srBannerToDelete?.image_url) {
            // Удаляем изображение баннера из Cloudinary
            await deleteImageFromCloudinaryByUrl(srBannerToDelete.image_url);
          }
        }
      } else {
        console.error('Ошибка получения информации о баннере перед удалением:', fetchError);
      }
    } else if (bannerToDelete?.image_url) {
      // Удаляем изображение баннера из Cloudinary
      await deleteImageFromCloudinaryByUrl(bannerToDelete.image_url);
    }

    // Удаляем баннер
    const deleteResult = await supabaseWithRetry(supabase, (client) =>
      client
        .from('banners')
        .delete()
        .eq('id', id)
    ) as { data: any; error: any };

    const { error: deleteError } = deleteResult;

    if (deleteError) {
      // If it's a permission error, try using service role client
      if (deleteError.code === '42501' || deleteError.message?.includes('permission denied')) {
        console.warn('Permission error detected, using service role client for banners DELETE');
        const serviceRoleClient = createServiceRoleClient();

        const srDeleteResult = await serviceRoleClient
          .from('banners')
          .delete()
          .eq('id', id);

        if (srDeleteResult.error) {
          return Response.json({ error: srDeleteResult.error.message }, { status: 500 });
        }

        // Логируем удаление баннера в аудите
        try {
          await auditService.logDelete('admin', 'banners', id);
        } catch (auditError) {
          console.error('Ошибка записи в аудит при удалении баннера:', auditError);
        }

        return Response.json({ success: true });
      }

      return Response.json({ error: deleteError.message }, { status: 500 });
    }

    // Логируем удаление баннера в аудите
    try {
      await auditService.logDelete('admin', 'banners', id);
    } catch (auditError) {
      console.error('Ошибка записи в аудит при удалении баннера:', auditError);
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