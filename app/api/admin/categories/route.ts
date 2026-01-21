import { NextRequest } from 'next/server';
import { createAPIClient } from '@/lib/supabase-server';
import { auditService } from '@/utils/audit-service';

export async function GET(request: NextRequest) {
  try {
    // Используем реальный Supabase клиент для API маршрутов
    const supabase = await createAPIClient(request);

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, image_url, sort_order } = body;

    // Используем реальный Supabase клиент для API маршрутов
    const supabase = await createAPIClient(request);

    const { data, error } = await supabase
      .from('categories')
      .insert([{ name, image_url, sort_order: sort_order || 0 }])
      .select();

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

    const { data, error } = await supabase
      .from('categories')
      .update({ name, image_url, sort_order })
      .eq('id', id)
      .select();

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
    const { data: categoryToDelete, error: fetchError } = await supabase
      .from('categories')
      .select('image_url')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Ошибка получения информации о категории перед удалением:', fetchError);
    } else if (categoryToDelete?.image_url) {
      // Удаляем изображение категории из Cloudinary
      await deleteImageFromCloudinaryByUrl(categoryToDelete.image_url);
    }

    // Удаляем категорию (каскадно удалятся связанные продукты)
    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

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