import { NextRequest } from 'next/server';
import { createAPIClient } from '@/lib/supabase-server';
import { auditService } from '@/utils/audit-service';

// Получение всех баннеров
export async function GET(request: NextRequest) {
  try {
    // Используем реальный Supabase клиент для API маршрутов
    const supabase = await createAPIClient(request);

    const { data, error } = await supabase
      .from('banners')
      .select(`
        *,
        banner_group:banner_groups(title)
      `)
      .order('sort_order', { ascending: true });

    if (error) {
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

    const { data, error } = await supabase
      .from('banners')
      .insert([{ group_id, image_url, link_url, sort_order }])
      .select();

    if (error) {
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

    const { data, error } = await supabase
      .from('banners')
      .update({ group_id, image_url, link_url, sort_order })
      .eq('id', id)
      .select();

    if (error) {
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
    const { data: bannerToDelete, error: fetchError } = await supabase
      .from('banners')
      .select('image_url')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Ошибка получения информации о баннере перед удалением:', fetchError);
    } else if (bannerToDelete?.image_url) {
      // Удаляем изображение баннера из Cloudinary
      await deleteImageFromCloudinaryByUrl(bannerToDelete.image_url);
    }

    // Удаляем баннер
    const { error: deleteError } = await supabase
      .from('banners')
      .delete()
      .eq('id', id);

    if (deleteError) {
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