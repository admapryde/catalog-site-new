import { NextRequest } from 'next/server';
import { createAPIClient, supabaseWithRetry } from '@/lib/supabase-server';
import { auditService } from '@/utils/audit-service';

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