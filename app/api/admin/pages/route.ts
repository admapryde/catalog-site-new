import { NextRequest } from 'next/server';
import { createAPIClient, supabaseWithRetry } from '@/lib/supabase-server';
import { getAdminSession } from '@/services/admin-auth-service';
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
      // If it's a permission error, try using service role client
      if (error.code === '42501' || error.message?.includes('permission denied')) {
        console.warn('Permission error detected, using service role client for pages GET');
        const serviceRoleClient = createServiceRoleClient();

        const srResult = await serviceRoleClient
          .from('pages')
          .select('*')
          .order('created_at', { ascending: true });

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
      // If it's a permission error, try using service role client
      if (result.error.code === '42501' || result.error.message?.includes('permission denied')) {
        console.warn('Permission error detected, using service role client for pages POST');
        const serviceRoleClient = createServiceRoleClient();

        const srResult = await serviceRoleClient
          .from('pages')
          .insert([{ title, slug }])
          .select();

        if (srResult.error) {
          console.error('Ошибка при вставке страницы через service role:', srResult.error);
          return Response.json({ error: srResult.error.message }, { status: 500 });
        }

        // Логируем создание страницы в аудите
        try {
          await auditService.logCreate('admin', 'pages', srResult.data?.[0]?.id);
        } catch (auditError) {
          console.error('Ошибка записи в аудит при создании страницы:', auditError);
        }

        return Response.json(srResult.data);
      }

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
      // If it's a permission error, try using service role client
      if (result.error.code === '42501' || result.error.message?.includes('permission denied')) {
        console.warn('Permission error detected, using service role client for pages PUT');
        const serviceRoleClient = createServiceRoleClient();

        const srResult = await serviceRoleClient
          .from('pages')
          .update({ title, slug })
          .eq('id', id)
          .select();

        if (srResult.error) {
          console.error('Ошибка при обновлении страницы через service role:', srResult.error);
          return Response.json({ error: srResult.error.message }, { status: 500 });
        }

        // Логируем обновление страницы в аудите
        try {
          await auditService.logUpdate('admin', 'pages', id);
        } catch (auditError) {
          console.error('Ошибка записи в аудит при обновлении страницы:', auditError);
        }

        return Response.json(srResult.data);
      }

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
      // If it's a permission error, try using service role client
      if (blocksFetchError.code === '42501' || blocksFetchError.message?.includes('permission denied')) {
        console.warn('Permission error detected, using service role client for page blocks fetch before deletion');
        const serviceRoleClient = createServiceRoleClient();

        const srBlocksResult = await serviceRoleClient
          .from('page_blocks')
          .select(`
            *,
            page_block_images(image_url)
          `)
          .eq('page_id', id);

        if (srBlocksResult.error) {
          console.error('Ошибка получения блоков перед удалением страницы через service role:', srBlocksResult.error);
        } else {
          const srBlocksToDelete = srBlocksResult.data;
          // Удаляем изображения всех блоков из Cloudinary
          for (const block of srBlocksToDelete || []) {
            if (block.page_block_images && Array.isArray(block.page_block_images)) {
              for (const image of block.page_block_images) {
                if (image.image_url) {
                  await deleteImageFromCloudinaryByUrl(image.image_url);
                }
              }
            }
          }
        }
      } else {
        console.error('Ошибка получения блоков перед удалением страницы:', blocksFetchError);
      }
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
      // If it's a permission error, try using service role client
      if (deleteResult.error.code === '42501' || deleteResult.error.message?.includes('permission denied')) {
        console.warn('Permission error detected, using service role client for pages DELETE');
        const serviceRoleClient = createServiceRoleClient();

        const srDeleteResult = await serviceRoleClient
          .from('pages')
          .delete()
          .eq('id', id);

        if (srDeleteResult.error) {
          console.error('Ошибка при удалении страницы через service role:', srDeleteResult.error);
          return Response.json({ error: srDeleteResult.error.message }, { status: 500 });
        }

        // Логируем удаление страницы в аудите
        try {
          await auditService.logDelete('admin', 'pages', id);
        } catch (auditError) {
          console.error('Ошибка записи в аудит при удалении страницы:', auditError);
        }

        return Response.json({ success: true });
      }

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