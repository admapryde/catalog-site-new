import { NextRequest } from 'next/server';
import { createAPIClient, supabaseWithRetry } from '@/lib/supabase-server';
import { getAdminSession } from '@/services/admin-auth-service';
import { auditService } from '@/utils/audit-service';
import { cacheManager } from '@/utils/cache-manager';

// Кэшируем результаты запросов на 5 минут
const CACHE_DURATION = 5 * 60 * 1000; // 5 минут в миллисекундах

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
  try {
    const body = await request.json();
    const { name, image_url, sort_order } = body;

    // Используем реальный Supabase клиент для API маршрутов
    const supabase = await createAPIClient(request);

    const result = await supabase
      .from('categories')
      .insert([{ name, image_url, sort_order: sort_order || 0 }])
      .select() as { data: any; error: any };

    const { data, error } = result;

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Логируем создание категории в аудите
    try {
      await auditService.logCreate('admin', 'categories', data?.[0]?.id);
    } catch (auditError) {
      console.error('Ошибка записи в аудит при создании категории:', auditError);
    }

    /*
    // Инвалидируем кэш для категорий на главной странице
    try {
      const { revalidateTag, revalidatePath } = await import('next/cache');
      await Promise.allSettled([
        revalidateTag('homepage_categories'),
        revalidatePath('/'),
        revalidatePath('/api/categories')
      ]);
    } catch (cacheError) {
      console.error('Ошибка инвалидации кэша категорий:', cacheError);
    }
    */

    return Response.json(data);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, image_url, sort_order } = body;

    // Используем реальный Supabase клиент для API маршрутов
    const supabase = await createAPIClient(request);

    const result = await supabase
      .from('categories')
      .update({ name, image_url, sort_order })
      .eq('id', id)
      .select() as { data: any; error: any };

    const { data, error } = result;

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Логируем обновление категории в аудите
    try {
      await auditService.logUpdate('admin', 'categories', id);
    } catch (auditError) {
      console.error('Ошибка записи в аудит при обновлении категории:', auditError);
    }

    /*
    // Инвалидируем кэш для категорий на главной странице
    try {
      const { revalidateTag, revalidatePath } = await import('next/cache');
      await Promise.allSettled([
        revalidateTag('homepage_categories'),
        revalidatePath('/'),
        revalidatePath('/api/categories')
      ]);
    } catch (cacheError) {
      console.error('Ошибка инвалидации кэша категорий:', cacheError);
    }
    */

    return Response.json(data);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

import { deleteImageFromCloudinaryByUrl } from '@/utils/cloudinary-helpers';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({ error: 'ID категории не указан' }, { status: 400 });
    }

    // Используем реальный Supabase клиент для API маршрутов
    const supabase = await createAPIClient(request);

    // Получаем информацию о категории перед удалением для возможной очистки изображения из Cloudinary
    const result = await supabase
      .from('categories')
      .select('image_url')
      .eq('id', id)
      .single() as { data: any; error: any };

    const { data: categoryToDelete, error: fetchError } = result;

    if (fetchError) {
      console.error('Ошибка получения информации о категории перед удалением:', fetchError);
    } else if (categoryToDelete?.image_url) {
      // Удаляем изображение категории из Cloudinary
      await deleteImageFromCloudinaryByUrl(categoryToDelete.image_url);
    }

    // Удаляем категорию (каскадно удалятся связанные продукты)
    const deleteResult = await supabase
      .from('categories')
      .delete()
      .eq('id', id) as { data: any; error: any };

    const { error: deleteError } = deleteResult;

    if (deleteError) {
      return Response.json({ error: deleteError.message }, { status: 500 });
    }

    // Логируем удаление категории в аудите
    try {
      await auditService.logDelete('admin', 'categories', id);
    } catch (auditError) {
      console.error('Ошибка записи в аудит при удалении категории:', auditError);
    }

    /*
    // Инвалидируем кэш для категорий на главной странице
    try {
      const { revalidateTag, revalidatePath } = await import('next/cache');
      await Promise.allSettled([
        revalidateTag('homepage_categories'),
        revalidatePath('/'),
        revalidatePath('/api/categories')
      ]);
    } catch (cacheError) {
      console.error('Ошибка инвалидации кэша категорий:', cacheError);
    }
    */

    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}