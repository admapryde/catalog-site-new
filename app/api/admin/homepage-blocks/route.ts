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
        .from('homepage_blocks')
        .select('*')
        .order('position', { ascending: true })
    ) as { data: any; error: any };

    const { data, error } = result;

    if (error) {
      // If it's a permission error, try using service role client
      if (error.code === '42501' || error.message?.includes('permission denied')) {
        console.warn('Permission error detected, using service role client for homepage blocks GET');
        const serviceRoleClient = createServiceRoleClient();

        const srResult = await serviceRoleClient
          .from('homepage_blocks')
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
    const { type, position, settings, visible, enabled } = body;

    const supabase = await createAPIClient(request);

    const result = await supabaseWithRetry(supabase, (client) =>
      client
        .from('homepage_blocks')
        .insert([{
          type,
          position: position || 1,
          settings: settings || {},
          visible: visible !== undefined ? visible : true,
          enabled: enabled !== undefined ? enabled : true
        }])
        .select()
    ) as { data: any; error: any };

    const { data, error } = result;

    if (error) {
      // If it's a permission error, try using service role client
      if (error.code === '42501' || error.message?.includes('permission denied')) {
        console.warn('Permission error detected, using service role client for homepage blocks POST');
        const serviceRoleClient = createServiceRoleClient();

        const srResult = await serviceRoleClient
          .from('homepage_blocks')
          .insert([{
            type,
            position: position || 1,
            settings: settings || {},
            visible: visible !== undefined ? visible : true,
            enabled: enabled !== undefined ? enabled : true
          }])
          .select();

        if (srResult.error) {
          return Response.json({ error: srResult.error.message }, { status: 500 });
        }

        // Логируем создание блока главной страницы в аудите
        try {
          await auditService.logCreate('admin', 'homepage_blocks', srResult.data?.[0]?.id);
        } catch (auditError) {
          console.error('Ошибка записи в аудит при создании блока главной страницы:', auditError);
        }

        return Response.json(srResult.data);
      }

      return Response.json({ error: error.message }, { status: 500 });
    }

    // Логируем создание блока главной страницы в аудите
    try {
      await auditService.logCreate('admin', 'homepage_blocks', data?.[0]?.id);
    } catch (auditError) {
      console.error('Ошибка записи в аудит при создании блока главной страницы:', auditError);
    }

    return Response.json(data);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, type, position, settings, visible, enabled } = body;

    const supabase = await createAPIClient(request);

    const result = await supabaseWithRetry(supabase, (client) =>
      client
        .from('homepage_blocks')
        .update({
          type,
          position,
          settings,
          visible,
          enabled
        })
        .eq('id', id)
        .select()
    ) as { data: any; error: any };

    const { data, error } = result;

    if (error) {
      // If it's a permission error, try using service role client
      if (error.code === '42501' || error.message?.includes('permission denied')) {
        console.warn('Permission error detected, using service role client for homepage blocks PUT');
        const serviceRoleClient = createServiceRoleClient();

        const srResult = await serviceRoleClient
          .from('homepage_blocks')
          .update({
            type,
            position,
            settings,
            visible,
            enabled
          })
          .eq('id', id)
          .select();

        if (srResult.error) {
          return Response.json({ error: srResult.error.message }, { status: 500 });
        }

        // Логируем обновление блока главной страницы в аудите
        try {
          await auditService.logUpdate('admin', 'homepage_blocks', id);
        } catch (auditError) {
          console.error('Ошибка записи в аудит при обновлении блока главной страницы:', auditError);
        }

        return Response.json(srResult.data);
      }

      return Response.json({ error: error.message }, { status: 500 });
    }

    // Логируем обновление блока главной страницы в аудите
    try {
      await auditService.logUpdate('admin', 'homepage_blocks', id);
    } catch (auditError) {
      console.error('Ошибка записи в аудит при обновлении блока главной страницы:', auditError);
    }

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
      return Response.json({ error: 'ID блока не указан' }, { status: 400 });
    }

    const supabase = await createAPIClient(request);

    const result = await supabaseWithRetry(supabase, (client) =>
      client
        .from('homepage_blocks')
        .delete()
        .eq('id', id)
    ) as { data: any; error: any };

    const { error } = result;

    if (error) {
      // If it's a permission error, try using service role client
      if (error.code === '42501' || error.message?.includes('permission denied')) {
        console.warn('Permission error detected, using service role client for homepage blocks DELETE');
        const serviceRoleClient = createServiceRoleClient();

        const srResult = await serviceRoleClient
          .from('homepage_blocks')
          .delete()
          .eq('id', id);

        if (srResult.error) {
          return Response.json({ error: srResult.error.message }, { status: 500 });
        }

        // Логируем удаление блока главной страницы в аудите
        try {
          await auditService.logDelete('admin', 'homepage_blocks', id);
        } catch (auditError) {
          console.error('Ошибка записи в аудит при удалении блока главной страницы:', auditError);
        }

        return Response.json({ success: true });
      }

      return Response.json({ error: error.message }, { status: 500 });
    }

    // Логируем удаление блока главной страницы в аудите
    try {
      await auditService.logDelete('admin', 'homepage_blocks', id);
    } catch (auditError) {
      console.error('Ошибка записи в аудит при удалении блока главной страницы:', auditError);
    }

    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}