import { NextRequest } from 'next/server';
import { createAPIClient, supabaseWithRetry } from '@/lib/supabase-server';
import { getAdminSession, getAdminSessionFromRequest } from '@/services/admin-auth-service';
import { auditService } from '@/utils/audit-service';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Create a service role client for admin operations
function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Отсутствуют переменные окружения для Supabase SERVICE ROLE');
  }

  return createSupabaseClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  });
}

// Получение всех блоков для конкретной страницы
export async function GET(request: NextRequest) {
  // Проверяем, что пользователь аутентифицирован как администратор
  const adminUser = await getAdminSessionFromRequest(request);
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
  const adminUser = await getAdminSessionFromRequest(request);
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
      // If it's a permission error, try using service role client
      if (result.error.code === '42501' || result.error.message?.includes('permission denied')) {
        console.warn('Permission error detected, using service role client for page blocks POST');
        const serviceRoleClient = createServiceRoleClient();

        const srResult = await serviceRoleClient
          .from('page_blocks')
          .insert([{ page_id, block_type, title, content, sort_order }])
          .select();

        if (srResult.error) {
          console.error('Ошибка при вставке блока через service role:', srResult.error);
          return Response.json({ error: srResult.error.message }, { status: 500 });
        }

        const { data } = srResult;

        // Логируем создание блока в аудите
        try {
          await auditService.logCreate(adminUser.email || 'admin', 'page_blocks', data?.[0]?.id, adminUser.id);
        } catch (auditError) {
          console.error('Ошибка записи в аудит при создании блока:', auditError);
        }

        return Response.json(srResult.data);
      }

      console.error('Ошибка при вставке блока:', result.error);
      return Response.json({ error: result.error.message }, { status: 500 });
    }

    const { data } = result;

    // Логируем создание блока в аудите
    try {
      await auditService.logCreate(adminUser.email || 'admin', 'page_blocks', data?.[0]?.id, adminUser.id);
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
  const adminUser = await getAdminSessionFromRequest(request);
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
          // If it's a permission error, try using service role client
          if (result.error.code === '42501' || result.error.message?.includes('permission denied')) {
            console.warn('Permission error detected, using service role client for page blocks update');
            const serviceRoleClient = createServiceRoleClient();

            const srResult = await serviceRoleClient
              .from('page_blocks')
              .update({ page_id, block_type, title, content, sort_order })
              .eq('id', id)
              .select();

            if (srResult.error) {
              console.error('Ошибка при обновлении блока через service role:', srResult.error);
              return Response.json({ error: srResult.error.message }, { status: 500 });
            }

            results.push(srResult.data[0]);

            // Логируем обновление блока в аудите
            try {
              await auditService.logUpdate(adminUser.email || 'admin', 'page_blocks', id, adminUser.id);
            } catch (auditError) {
              console.error('Ошибка записи в аудит при обновлении блока:', auditError);
            }
          } else {
            console.error('Ошибка при обновлении блока:', result.error);
            return Response.json({ error: result.error.message }, { status: 500 });
          }
        } else {
          results.push(result.data[0]);

          // Логируем обновление блока в аудите
          try {
            await auditService.logUpdate(adminUser.email || 'admin', 'page_blocks', id, adminUser.id);
          } catch (auditError) {
            console.error('Ошибка записи в аудит при обновлении блока:', auditError);
          }
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
        // If it's a permission error, try using service role client
        if (result.error.code === '42501' || result.error.message?.includes('permission denied')) {
          console.warn('Permission error detected, using service role client for page blocks update');
          const serviceRoleClient = createServiceRoleClient();

          const srResult = await serviceRoleClient
            .from('page_blocks')
            .update({ page_id, block_type, title, content, sort_order })
            .eq('id', id)
            .select();

          if (srResult.error) {
            console.error('Ошибка при обновлении блока через service role:', srResult.error);
            return Response.json({ error: srResult.error.message }, { status: 500 });
          }

          const { data } = srResult;

          // Логируем обновление блока в аудите
          try {
            await auditService.logUpdate(adminUser.email || 'admin', 'page_blocks', id, adminUser.id);
          } catch (auditError) {
            console.error('Ошибка записи в аудит при обновлении блока:', auditError);
          }

          return Response.json(data);
        }

        console.error('Ошибка при обновлении блока:', result.error);
        return Response.json({ error: result.error.message }, { status: 500 });
      }

      const { data } = result;

      // Логируем обновление блока в аудите
      try {
        await auditService.logUpdate(adminUser.email || 'admin', 'page_blocks', id, adminUser.id);
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
  const adminUser = await getAdminSessionFromRequest(request);
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
    const blockFetchResult = await supabaseWithRetry(supabase, async (client) =>
      await client
        .from('page_blocks')
        .select(`
          *,
          page_block_images(image_url)
        `)
        .eq('id', id)
        .single()
    ) as { data: any; error: any };

    const { data: blockToDelete, error: fetchError } = blockFetchResult;

    if (fetchError) {
      // If it's a permission error, try using service role client
      if (fetchError.code === '42501' || fetchError.message?.includes('permission denied')) {
        console.warn('Permission error detected, using service role client for page block fetch before deletion');
        const serviceRoleClient = createServiceRoleClient();

        const srBlockResult = await serviceRoleClient
          .from('page_blocks')
          .select(`
            *,
            page_block_images(image_url)
          `)
          .eq('id', id)
          .single();

        if (srBlockResult.error) {
          console.error('Ошибка получения информации о блоке перед удалением через service role:', srBlockResult.error);
        } else {
          const srBlockToDelete = srBlockResult.data;
          if (srBlockToDelete?.page_block_images && Array.isArray(srBlockToDelete.page_block_images)) {
            // Удаляем изображения блока из Cloudinary
            for (const image of srBlockToDelete.page_block_images) {
              if (image.image_url) {
                await deleteImageFromCloudinaryByUrl(image.image_url);
              }
            }
          }
        }
      } else {
        console.error('Ошибка получения информации о блоке перед удалением:', fetchError);
      }
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
      // If it's a permission error, try using service role client
      if (deleteResult.error.code === '42501' || deleteResult.error.message?.includes('permission denied')) {
        console.warn('Permission error detected, using service role client for page blocks DELETE');
        const serviceRoleClient = createServiceRoleClient();

        const srDeleteResult = await serviceRoleClient
          .from('page_blocks')
          .delete()
          .eq('id', id);

        if (srDeleteResult.error) {
          console.error('Ошибка при удалении блока через service role:', srDeleteResult.error);
          return Response.json({ error: srDeleteResult.error.message }, { status: 500 });
        }

        // Логируем удаление блока в аудите
        try {
          await auditService.logDelete(adminUser.email || 'admin', 'page_blocks', id, adminUser.id);
        } catch (auditError) {
          console.error('Ошибка записи в аудит при удалении блока:', auditError);
        }

        return Response.json({ success: true });
      }

      console.error('Ошибка при удалении блока:', deleteResult.error);
      return Response.json({ error: deleteResult.error.message }, { status: 500 });
    }

    // Логируем удаление блока в аудите
    try {
      await auditService.logDelete(adminUser.email || 'admin', 'page_blocks', id, adminUser.id);
    } catch (auditError) {
      console.error('Ошибка записи в аудит при удалении блока:', auditError);
    }

    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}