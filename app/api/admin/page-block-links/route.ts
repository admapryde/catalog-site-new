import { NextRequest } from 'next/server';
import { createAPIClient, supabaseWithRetry } from '@/lib/supabase-server';
import { getAdminSession } from '@/services/admin-auth-service';
import { auditService } from '@/utils/audit-service';

// Получение всех ссылок для конкретного блока
export async function GET(request: NextRequest) {
  // Проверяем, что пользователь аутентифицирован как администратор
  const adminUser = await getAdminSession();
  if (!adminUser) {
    return Response.json({ error: 'Требуется аутентификация администратора' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const blockId = searchParams.get('blockId');

    const supabase = await createAPIClient(request);

    let query = supabase
      .from('page_block_links')
      .select('*')
      .order('sort_order', { ascending: true });

    if (blockId) {
      query = query.eq('block_id', blockId);
    }

    const result = await supabaseWithRetry(supabase, async (client) => {
      let queryBuilder = client
        .from('page_block_links')
        .select('*')
        .order('sort_order', { ascending: true });

      if (blockId) {
        queryBuilder = queryBuilder.eq('block_id', blockId);
      }

      return await queryBuilder;
    }) as { data: any; error: any };

    const { data, error } = result;

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// Создание новой ссылки для блока
export async function POST(request: NextRequest) {
  // Проверяем, что пользователь аутентифицирован как администратор
  const adminUser = await getAdminSession();
  if (!adminUser) {
    return Response.json({ error: 'Требуется аутентификация администратора' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { block_id, title, url, sort_order } = body;

    const supabase = await createAPIClient(request);

    const result = await supabaseWithRetry(supabase, async (client) =>
      await client
        .from('page_block_links')
        .insert([{ block_id, title, url, sort_order }])
        .select()
    ) as { data: any; error: any };

    if (result.error) {
      console.error('Ошибка при вставке ссылки блока:', result.error);
      return Response.json({ error: result.error.message }, { status: 500 });
    }

    const { data } = result;

    // Логируем создание ссылки в аудите
    try {
      await auditService.logCreate('admin', 'page_block_links', data?.[0]?.id);
    } catch (auditError) {
      console.error('Ошибка записи в аудит при создании ссылки:', auditError);
    }

    return Response.json(data);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// Обновление ссылки
export async function PUT(request: NextRequest) {
  // Проверяем, что пользователь аутентифицирован как администратор
  const adminUser = await getAdminSession();
  if (!adminUser) {
    return Response.json({ error: 'Требуется аутентификация администратора' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, block_id, title, url, sort_order } = body;

    const supabase = await createAPIClient(request);

    const result = await supabaseWithRetry(supabase, async (client) =>
      await client
        .from('page_block_links')
        .update({ block_id, title, url, sort_order })
        .eq('id', id)
        .select()
    ) as { data: any; error: any };

    if (result.error) {
      console.error('Ошибка при обновлении ссылки блока:', result.error);
      return Response.json({ error: result.error.message }, { status: 500 });
    }

    const { data } = result;

    // Логируем обновление ссылки в аудите
    try {
      await auditService.logUpdate('admin', 'page_block_links', id);
    } catch (auditError) {
      console.error('Ошибка записи в аудит при обновлении ссылки:', auditError);
    }

    return Response.json(data);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// Удаление ссылки
export async function DELETE(request: NextRequest) {
  // Проверяем, что пользователь аутентифицирован как администратор
  const adminUser = await getAdminSession();
  if (!adminUser) {
    return Response.json({ error: 'Требуется аутентификация администратора' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({ error: 'ID ссылки не указан' }, { status: 400 });
    }

    const supabase = await createAPIClient(request);

    // Удаляем ссылку
    const deleteResult = await supabaseWithRetry(supabase, async (client) =>
      await client
        .from('page_block_links')
        .delete()
        .eq('id', id)
    ) as { data: any; error: any };

    if (deleteResult.error) {
      console.error('Ошибка при удалении ссылки блока:', deleteResult.error);
      return Response.json({ error: deleteResult.error.message }, { status: 500 });
    }

    // Логируем удаление ссылки в аудите
    try {
      await auditService.logDelete('admin', 'page_block_links', id);
    } catch (auditError) {
      console.error('Ошибка записи в аудит при удалении ссылки:', auditError);
    }

    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}