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

export async function GET(request: NextRequest) {
  try {
    const supabase = await createAPIClient(request);

    const result = await supabaseWithRetry(supabase, (client) =>
      client
        .from('homepage_sections')
        .select('*')
        .order('position', { ascending: true })
    ) as { data: any; error: any };

    const { data, error } = result;

    if (error) {
      // If it's a permission error, try using service role client
      if (error.code === '42501' || error.message?.includes('permission denied')) {
        console.warn('Permission error detected, using service role client for homepage sections GET');
        const serviceRoleClient = createServiceRoleClient();

        const srResult = await serviceRoleClient
          .from('homepage_sections')
          .select('*')
          .order('position', { ascending: true });

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, position, section_type } = body;

    const supabase = await createAPIClient(request);

    const result = await supabaseWithRetry(supabase, (client) =>
      client
        .from('homepage_sections')
        .insert([{ title, position: position || 1, section_type: section_type || null }])
        .select()
    ) as { data: any; error: any };

    const { data, error } = result;

    if (error) {
      // If it's a permission error, try using service role client
      if (error.code === '42501' || error.message?.includes('permission denied')) {
        console.warn('Permission error detected, using service role client for homepage sections POST');
        const serviceRoleClient = createServiceRoleClient();

        const srResult = await serviceRoleClient
          .from('homepage_sections')
          .insert([{ title, position: position || 1, section_type: section_type || null }])
          .select();

        if (srResult.error) {
          return Response.json({ error: srResult.error.message }, { status: 500 });
        }

        // Логируем создание раздела главной страницы в аудите
        try {
          await auditService.logCreate('admin', 'homepage_sections', srResult.data?.[0]?.id);
        } catch (auditError) {
          console.error('Ошибка записи в аудит при создании раздела главной страницы:', auditError);
        }

        return Response.json(srResult.data);
      }

      return Response.json({ error: error.message }, { status: 500 });
    }

    // Логируем создание раздела главной страницы в аудите
    try {
      await auditService.logCreate('admin', 'homepage_sections', data?.[0]?.id);
    } catch (auditError) {
      console.error('Ошибка записи в аудит при создании раздела главной страницы:', auditError);
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
    const { id, title, position, section_type } = body;

    const supabase = await createAPIClient(request);

    const result = await supabaseWithRetry(supabase, (client) =>
      client
        .from('homepage_sections')
        .update({ title, position, section_type })
        .eq('id', id)
        .select()
    ) as { data: any; error: any };

    const { data, error } = result;

    if (error) {
      // If it's a permission error, try using service role client
      if (error.code === '42501' || error.message?.includes('permission denied')) {
        console.warn('Permission error detected, using service role client for homepage sections PUT');
        const serviceRoleClient = createServiceRoleClient();

        const srResult = await serviceRoleClient
          .from('homepage_sections')
          .update({ title, position, section_type })
          .eq('id', id)
          .select();

        if (srResult.error) {
          return Response.json({ error: srResult.error.message }, { status: 500 });
        }

        // Логируем обновление раздела главной страницы в аудите
        try {
          await auditService.logUpdate('admin', 'homepage_sections', id);
        } catch (auditError) {
          console.error('Ошибка записи в аудит при обновлении раздела главной страницы:', auditError);
        }

        return Response.json(srResult.data);
      }

      return Response.json({ error: error.message }, { status: 500 });
    }

    // Логируем обновление раздела главной страницы в аудите
    try {
      await auditService.logUpdate('admin', 'homepage_sections', id);
    } catch (auditError) {
      console.error('Ошибка записи в аудит при обновлении раздела главной страницы:', auditError);
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
      return Response.json({ error: 'ID раздела не указан' }, { status: 400 });
    }

    const supabase = await createAPIClient(request);

    const result = await supabaseWithRetry(supabase, (client) =>
      client
        .from('homepage_sections')
        .delete()
        .eq('id', id)
    ) as { data: any; error: any };

    const { error } = result;

    if (error) {
      // If it's a permission error, try using service role client
      if (error.code === '42501' || error.message?.includes('permission denied')) {
        console.warn('Permission error detected, using service role client for homepage sections DELETE');
        const serviceRoleClient = createServiceRoleClient();

        const srResult = await serviceRoleClient
          .from('homepage_sections')
          .delete()
          .eq('id', id);

        if (srResult.error) {
          return Response.json({ error: srResult.error.message }, { status: 500 });
        }

        // Логируем удаление раздела главной страницы в аудите
        try {
          await auditService.logDelete('admin', 'homepage_sections', id);
        } catch (auditError) {
          console.error('Ошибка записи в аудит при удалении раздела главной страницы:', auditError);
        }

        return Response.json({ success: true });
      }

      return Response.json({ error: error.message }, { status: 500 });
    }

    // Логируем удаление раздела главной страницы в аудите
    try {
      await auditService.logDelete('admin', 'homepage_sections', id);
    } catch (auditError) {
      console.error('Ошибка записи в аудит при удалении раздела главной страницы:', auditError);
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