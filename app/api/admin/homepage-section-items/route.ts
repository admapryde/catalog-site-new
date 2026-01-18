import { NextRequest } from 'next/server';
import { createAPIClient } from '@/lib/supabase-server';
import { auditService } from '@/utils/audit-service';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createAPIClient(request);

    const { data, error } = await supabase
      .from('homepage_section_items')
      .select(`
        *,
        product:products(name, price, category_id),
        section:homepage_sections(title)
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { section_id, product_id, sort_order } = body;

    const supabase = await createAPIClient(request);

    const { data, error } = await supabase
      .from('homepage_section_items')
      .insert([{ section_id, product_id, sort_order: sort_order || 0 }])
      .select();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Логируем создание элемента раздела главной страницы в аудите
    try {
      await auditService.logCreate('admin', 'homepage_section_items', data?.[0]?.id);
    } catch (auditError) {
      console.error('Ошибка записи в аудит при создании элемента раздела главной страницы:', auditError);
    }

    /*
    // Инвалидируем кэш для разделов ГС
    try {
      const { revalidateTag, revalidatePath } = await import('next/cache');
      await Promise.allSettled([
        revalidateTag('homepage_sections'),
        revalidatePath('/'),
        revalidatePath('/api/homepage-sections')
      ]);
    } catch (cacheError) {
      console.error('Ошибка инвалидации кэша разделов ГС:', cacheError);
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
    const { id, section_id, product_id, sort_order } = body;

    const supabase = await createAPIClient(request);

    const { data, error } = await supabase
      .from('homepage_section_items')
      .update({ section_id, product_id, sort_order })
      .eq('id', id)
      .select();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Логируем обновление элемента раздела главной страницы в аудите
    try {
      await auditService.logUpdate('admin', 'homepage_section_items', id);
    } catch (auditError) {
      console.error('Ошибка записи в аудит при обновлении элемента раздела главной страницы:', auditError);
    }

    /*
    // Инвалидируем кэш для разделов ГС
    try {
      const { revalidateTag, revalidatePath } = await import('next/cache');
      await Promise.allSettled([
        revalidateTag('homepage_sections'),
        revalidatePath('/'),
        revalidatePath('/api/homepage-sections')
      ]);
    } catch (cacheError) {
      console.error('Ошибка инвалидации кэша разделов ГС:', cacheError);
    }
    */

    return Response.json(data);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({ error: 'ID элемента раздела не указан' }, { status: 400 });
    }

    const supabase = await createAPIClient(request);

    const { error } = await supabase
      .from('homepage_section_items')
      .delete()
      .eq('id', id);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Логируем удаление элемента раздела главной страницы в аудите
    try {
      await auditService.logDelete('admin', 'homepage_section_items', id);
    } catch (auditError) {
      console.error('Ошибка записи в аудит при удалении элемента раздела главной страницы:', auditError);
    }

    /*
    // Инвалидируем кэш для разделов ГС
    try {
      const { revalidateTag, revalidatePath } = await import('next/cache');
      await Promise.allSettled([
        revalidateTag('homepage_sections'),
        revalidatePath('/'),
        revalidatePath('/api/homepage-sections')
      ]);
    } catch (cacheError) {
      console.error('Ошибка инвалидации кэша разделов ГС:', cacheError);
    }
    */

    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}