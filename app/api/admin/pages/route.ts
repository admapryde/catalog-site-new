import { NextRequest } from 'next/server';
import { createAPIClient, supabaseWithRetry } from '@/lib/supabase-server';
import { getAdminSession } from '@/services/admin-auth-service';
import { auditService } from '@/utils/audit-service';

// Получение всех страниц с блоками
export async function GET(request: NextRequest) {
  // Проверяем, что пользователь аутентифицирован как администратор
  const adminUser = await getAdminSession();
  if (!adminUser) {
    return Response.json({ error: 'Требуется аутентификация администратора' }, { status: 401 });
  }

  try {
    const supabase = await createAPIClient(request);

    const result = await supabaseWithRetry(supabase, (client) =>
      client
        .from('pages')
        .select('*')
        .order('created_at', { ascending: true })
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

// Создание новой страницы
export async function POST(request: NextRequest) {
  // Проверяем, что пользователь аутентифицирован как администратор
  const adminUser = await getAdminSession();
  if (!adminUser) {
    return Response.json({ error: 'Требуется аутентификация администратора' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, slug } = body;

    const supabase = await createAPIClient(request);

    const result = await supabaseWithRetry(supabase, (client) =>
      client
        .from('pages')
        .insert([{ title, slug }])
        .select()
    ) as { data: any; error: any };

    if (result.error) {
      console.error('Ошибка при вставке страницы:', result.error);
      return Response.json({ error: result.error.message }, { status: 500 });
    }

    const { data } = result;

    // Логируем создание страницы в аудите
    try {
      await auditService.logCreate('admin', 'pages', data?.[0]?.id);
    } catch (auditError) {
      console.error('Ошибка записи в аудит при создании страницы:', auditError);
    }

    return Response.json(data);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// Обновление страницы
export async function PUT(request: NextRequest) {
  // Проверяем, что пользователь аутентифицирован как администратор
  const adminUser = await getAdminSession();
  if (!adminUser) {
    return Response.json({ error: 'Требуется аутентификация администратора' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, title, slug } = body;

    const supabase = await createAPIClient(request);

    const result = await supabaseWithRetry(supabase, (client) =>
      client
        .from('pages')
        .update({ title, slug })
        .eq('id', id)
        .select()
    ) as { data: any; error: any };

    if (result.error) {
      console.error('Ошибка при обновлении страницы:', result.error);
      return Response.json({ error: result.error.message }, { status: 500 });
    }

    const { data } = result;

    // Логируем обновление страницы в аудите
    try {
      await auditService.logUpdate('admin', 'pages', id);
    } catch (auditError) {
      console.error('Ошибка записи в аудит при обновлении страницы:', auditError);
    }

    return Response.json(data);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

import { deleteImageFromCloudinaryByUrl } from '@/utils/cloudinary-helpers';

// Удаление страницы
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
      return Response.json({ error: 'ID страницы не указан' }, { status: 400 });
    }

    const supabase = await createAPIClient(request);

    // Получаем все блоки страницы и их изображения для удаления из Cloudinary
    const blocksResult = await supabaseWithRetry(supabase, (client) =>
      client
        .from('page_blocks')
        .select(`
          *,
          page_block_images(image_url)
        `)
        .eq('page_id', id)
    ) as { data: any; error: any };

    const { data: blocksToDelete, error: blocksFetchError } = blocksResult;

    if (blocksFetchError) {
      console.error('Ошибка получения блоков перед удалением страницы:', blocksFetchError);
    } else {
      // Удаляем изображения всех блоков из Cloudinary
      for (const block of blocksToDelete || []) {
        if (block.page_block_images && Array.isArray(block.page_block_images)) {
          for (const image of block.page_block_images) {
            if (image.image_url) {
              await deleteImageFromCloudinaryByUrl(image.image_url);
            }
          }
        }
      }
    }

    // Удаляем страницу (каскадно удалятся связанные блоки)
    const deleteResult = await supabaseWithRetry(supabase, (client) =>
      client
        .from('pages')
        .delete()
        .eq('id', id)
    ) as { data: any; error: any };

    if (deleteResult.error) {
      console.error('Ошибка при удалении страницы:', deleteResult.error);
      return Response.json({ error: deleteResult.error.message }, { status: 500 });
    }

    // Логируем удаление страницы в аудите
    try {
      await auditService.logDelete('admin', 'pages', id);
    } catch (auditError) {
      console.error('Ошибка записи в аудит при удалении страницы:', auditError);
    }

    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}