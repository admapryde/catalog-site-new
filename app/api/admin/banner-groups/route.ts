import { NextRequest } from 'next/server';
import { createAPIClient } from '@/lib/supabase-server';
import { auditService } from '@/utils/audit-service';

// Получение всех групп баннеров с баннерами
export async function GET(request: NextRequest) {
  try {
    // Используем реальный Supabase клиент для API маршрутов
    const supabase = await createAPIClient(request);

    const { data, error } = await supabase
      .from('banner_groups')
      .select(`
        *,
        banners(*)
      `)
      .order('position', { ascending: true });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// Создание новой группы баннеров
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, position } = body;

    // Используем реальный Supabase клиент для API маршрутов
    const supabase = await createAPIClient(request);

    const { data, error } = await supabase
      .from('banner_groups')
      .insert([{ title, position }])
      .select();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Логируем создание группы баннеров в аудите
    try {
      await auditService.logCreate('admin', 'banner_groups', data?.[0]?.id);
    } catch (auditError) {
      console.error('Ошибка записи в аудит при создании группы баннеров:', auditError);
    }

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

    return Response.json(data);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// Обновление группы баннеров
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, position } = body;

    // Используем реальный Supabase клиент для API маршрутов
    const supabase = await createAPIClient(request);

    const { data, error } = await supabase
      .from('banner_groups')
      .update({ title, position })
      .eq('id', id)
      .select();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Логируем обновление группы баннеров в аудите
    try {
      await auditService.logUpdate('admin', 'banner_groups', id);
    } catch (auditError) {
      console.error('Ошибка записи в аудит при обновлении группы баннеров:', auditError);
    }

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

    return Response.json(data);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// Удаление группы баннеров
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({ error: 'ID группы баннеров не указан' }, { status: 400 });
    }

    // Используем реальный Supabase клиент для API маршрутов
    const supabase = await createAPIClient(request);

    // Удаляем группу баннеров (каскадно удалятся связанные баннеры)
    const { error } = await supabase
      .from('banner_groups')
      .delete()
      .eq('id', id);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Логируем удаление группы баннеров в аудите
    try {
      await auditService.logDelete('admin', 'banner_groups', id);
    } catch (auditError) {
      console.error('Ошибка записи в аудит при удалении группы баннеров:', auditError);
    }

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

    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}