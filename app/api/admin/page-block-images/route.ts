import { NextRequest } from 'next/server';
import { createAPIClient, supabaseWithRetry } from '@/lib/supabase-server';
import { getAdminSession } from '@/services/admin-auth-service';
import { auditService } from '@/utils/audit-service';

// Получение всех изображений для конкретного блока
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
      .from('page_block_images')
      .select('*')
      .order('sort_order', { ascending: true });

    if (blockId) {
      query = query.eq('block_id', blockId);
    }

    const result = await supabaseWithRetry(supabase, async (client) => {
      let queryBuilder = client
        .from('page_block_images')
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

// Создание нового изображения для блока
export async function POST(request: NextRequest) {
  // Проверяем, что пользователь аутентифицирован как администратор
  const adminUser = await getAdminSession();
  if (!adminUser) {
    return Response.json({ error: 'Требуется аутентификация администратора' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { block_id, image_url, layout_type, text_content, sort_order, is_main } = body;

    const supabase = await createAPIClient(request);

    // Подготовим объект для вставки, включая text_content только если оно определено
    const insertObject: any = { block_id, image_url, layout_type, sort_order };
    if (typeof text_content !== 'undefined') {
      insertObject.text_content = text_content;
    }

    const result = await supabaseWithRetry(supabase, async (client) =>
      await client
        .from('page_block_images')
        .insert([insertObject])
        .select()
    ) as { data: any; error: any };

    if (result.error) {
      console.error('Ошибка при вставке изображения блока:', result.error);
      return Response.json({ error: result.error.message }, { status: 500 });
    }

    const { data } = result;

    // Логируем создание изображения в аудите
    try {
      await auditService.logCreate('admin', 'page_block_images', data?.[0]?.id);
    } catch (auditError) {
      console.error('Ошибка записи в аудит при создании изображения:', auditError);
    }

    return Response.json(data);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// Обновление изображения
export async function PUT(request: NextRequest) {
  // Проверяем, что пользователь аутентифицирован как администратор
  const adminUser = await getAdminSession();
  if (!adminUser) {
    return Response.json({ error: 'Требуется аутентификация администратора' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, block_id, image_url, layout_type, text_content, sort_order, is_main } = body;

    const supabase = await createAPIClient(request);

    // Подготовим объект для обновления, включая text_content только если оно определено
    const updateObject: any = { block_id, image_url, layout_type, sort_order };
    if (typeof text_content !== 'undefined') {
      updateObject.text_content = text_content;
    }

    const result = await supabaseWithRetry(supabase, async (client) =>
      await client
        .from('page_block_images')
        .update(updateObject)
        .eq('id', id)
        .select()
    ) as { data: any; error: any };

    if (result.error) {
      console.error('Ошибка при обновлении изображения блока:', result.error);
      return Response.json({ error: result.error.message }, { status: 500 });
    }

    const { data } = result;

    // Логируем обновление изображения в аудите
    try {
      await auditService.logUpdate('admin', 'page_block_images', id);
    } catch (auditError) {
      console.error('Ошибка записи в аудит при обновлении изображения:', auditError);
    }

    return Response.json(data);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

import { deleteImageFromCloudinaryByUrl } from '@/utils/cloudinary-helpers';

// Удаление изображения
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
      return Response.json({ error: 'ID изображения не указан' }, { status: 400 });
    }

    const supabase = await createAPIClient(request);

    // Получаем информацию об изображении перед удалением
    const imageResult = await supabaseWithRetry(supabase, async (client) =>
      await client
        .from('page_block_images')
        .select('image_url')
        .eq('id', id)
        .single()
    ) as { data: any; error: any };

    const { data: imageToDelete, error: fetchError } = imageResult;

    if (fetchError) {
      console.error('Ошибка получения информации об изображении перед удалением:', fetchError);
    } else if (imageToDelete?.image_url) {
      // Удаляем изображение из Cloudinary
      await deleteImageFromCloudinaryByUrl(imageToDelete.image_url);
    }

    // Удаляем изображение
    const deleteResult = await supabaseWithRetry(supabase, async (client) =>
      await client
        .from('page_block_images')
        .delete()
        .eq('id', id)
    ) as { data: any; error: any };

    if (deleteResult.error) {
      console.error('Ошибка при удалении изображения блока:', deleteResult.error);
      return Response.json({ error: deleteResult.error.message }, { status: 500 });
    }

    // Логируем удаление изображения в аудите
    try {
      await auditService.logDelete('admin', 'page_block_images', id);
    } catch (auditError) {
      console.error('Ошибка записи в аудит при удалении изображения:', auditError);
    }

    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}