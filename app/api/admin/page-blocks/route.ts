import { NextRequest } from 'next/server';
import { createAPIClient, supabaseWithRetry } from '@/lib/supabase-server';
import { getAdminSession } from '@/services/admin-auth-service';
import { auditService } from '@/utils/audit-service';

// Получение всех блоков для конкретной страницы
export async function GET(request: NextRequest) {
  // Проверяем, что пользователь аутентифицирован как администратор
  const adminUser = await getAdminSession();
  if (!adminUser) {
    return Response.json({ error: 'Требуется аутентификация администратора' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');

    const supabase = await createAPIClient(request);

    let query = supabase
      .from('page_blocks')
      .select(`
        *,
        page_block_images(*),
        page_block_links(*)
      `)
      .order('sort_order', { ascending: true });

    if (pageId) {
      query = query.eq('page_id', pageId);
    }

    const result = await supabaseWithRetry(supabase, async (client) => {
      let queryBuilder = client
        .from('page_blocks')
        .select(`
          *,
          page_block_images(*),
          page_block_links(*)
        `)
        .order('sort_order', { ascending: true });

      if (pageId) {
        queryBuilder = queryBuilder.eq('page_id', pageId);
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

// Создание нового блока
export async function POST(request: NextRequest) {
  // Проверяем, что пользователь аутентифицирован как администратор
  const adminUser = await getAdminSession();
  if (!adminUser) {
    return Response.json({ error: 'Требуется аутентификация администратора' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { page_id, block_type, title, content, sort_order } = body;

    const supabase = await createAPIClient(request);

    const result = await supabaseWithRetry(supabase, async (client) =>
      await client
        .from('page_blocks')
        .insert([{ page_id, block_type, title, content, sort_order }])
        .select()
    ) as { data: any; error: any };

    if (result.error) {
      console.error('Ошибка при вставке блока:', result.error);
      return Response.json({ error: result.error.message }, { status: 500 });
    }

    const { data } = result;

    // Логируем создание блока в аудите
    try {
      await auditService.logCreate('admin', 'page_blocks', data?.[0]?.id);
    } catch (auditError) {
      console.error('Ошибка записи в аудит при создании блока:', auditError);
    }

    return Response.json(data);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// Обновление блока
export async function PUT(request: NextRequest) {
  // Проверяем, что пользователь аутентифицирован как администратор
  const adminUser = await getAdminSession();
  if (!adminUser) {
    return Response.json({ error: 'Требуется аутентификация администратора' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Поддержка массового обновления
    if (Array.isArray(body) && body.length > 0) {
      // Массовое обновление
      const updates = body;

      const supabase = await createAPIClient(request);

      // Выполняем обновления в одной транзакции
      const results = [];
      for (const update of updates) {
        const { id, page_id, block_type, title, content, sort_order } = update;

        const result = await supabaseWithRetry(supabase, async (client) =>
          await client
            .from('page_blocks')
            .update({ page_id, block_type, title, content, sort_order })
            .eq('id', id)
            .select()
        ) as { data: any; error: any };

        if (result.error) {
          console.error('Ошибка при обновлении блока:', result.error);
          return Response.json({ error: result.error.message }, { status: 500 });
        }

        results.push(result.data[0]);

        // Логируем обновление блока в аудите
        try {
          await auditService.logUpdate('admin', 'page_blocks', id);
        } catch (auditError) {
          console.error('Ошибка записи в аудит при обновлении блока:', auditError);
        }
      }

      return Response.json(results);
    } else {
      // Одиночное обновление (старая логика)
      const { id, page_id, block_type, title, content, sort_order } = body;

      const supabase = await createAPIClient(request);

      const result = await supabaseWithRetry(supabase, async (client) =>
        await client
          .from('page_blocks')
          .update({ page_id, block_type, title, content, sort_order })
          .eq('id', id)
          .select()
      ) as { data: any; error: any };

      if (result.error) {
        console.error('Ошибка при обновлении блока:', result.error);
        return Response.json({ error: result.error.message }, { status: 500 });
      }

      const { data } = result;

      // Логируем обновление блока в аудите
      try {
        await auditService.logUpdate('admin', 'page_blocks', id);
      } catch (auditError) {
        console.error('Ошибка записи в аудит при обновлении блока:', auditError);
      }

      return Response.json(data);
    }
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

import { deleteImageFromCloudinaryByUrl } from '@/utils/cloudinary-helpers';

// Удаление блока
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
      return Response.json({ error: 'ID блока не указан' }, { status: 400 });
    }

    const supabase = await createAPIClient(request);

    // Получаем информацию о блоке и его изображениях перед удалением
    const blockResult = await supabaseWithRetry(supabase, async (client) =>
      await client
        .from('page_blocks')
        .select(`
          *,
          page_block_images(image_url)
        `)
        .eq('id', id)
        .single()
    ) as { data: any; error: any };

    const { data: blockToDelete, error: fetchError } = blockResult;

    if (fetchError) {
      console.error('Ошибка получения информации о блоке перед удалением:', fetchError);
    } else if (blockToDelete?.page_block_images && Array.isArray(blockToDelete.page_block_images)) {
      // Удаляем изображения блока из Cloudinary
      for (const image of blockToDelete.page_block_images) {
        if (image.image_url) {
          await deleteImageFromCloudinaryByUrl(image.image_url);
        }
      }
    }

    // Удаляем блок (каскадно удалятся связанные изображения и ссылки)
    const deleteResult = await supabaseWithRetry(supabase, async (client) =>
      await client
        .from('page_blocks')
        .delete()
        .eq('id', id)
    ) as { data: any; error: any };

    if (deleteResult.error) {
      console.error('Ошибка при удалении блока:', deleteResult.error);
      return Response.json({ error: deleteResult.error.message }, { status: 500 });
    }

    // Логируем удаление блока в аудите
    try {
      await auditService.logDelete('admin', 'page_blocks', id);
    } catch (auditError) {
      console.error('Ошибка записи в аудит при удалении блока:', auditError);
    }

    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}