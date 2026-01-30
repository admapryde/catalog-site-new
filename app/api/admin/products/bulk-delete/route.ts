import { NextRequest } from 'next/server';
import { createAPIClient, supabaseWithRetry } from '@/lib/supabase-server';
import { getAdminSession, getAdminSessionFromRequest } from '@/services/admin-auth-service';
import { auditService } from '@/utils/audit-service';
import { cacheManager } from '@/utils/cache-manager';
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

export async function DELETE(request: NextRequest) {
  try {
    // Проверяем, что пользователь аутентифицирован как администратор
    const adminUser = await getAdminSessionFromRequest(request);
    if (!adminUser) {
      return Response.json({ error: 'Требуется аутентификация администратора' }, { status: 401 });
    }

    const body = await request.json();
    const { productIds } = body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return Response.json({ error: 'Необходимо предоставить массив ID товаров для удаления' }, { status: 400 });
    }

    // Проверяем, что все ID являются валидными UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    for (const id of productIds) {
      if (!uuidRegex.test(id)) {
        return Response.json({ error: `Invalid product ID format: ${id}` }, { status: 400 });
      }
    }

    // Используем реальный Supabase клиент для API маршрутов
    const supabase = await createAPIClient(request);

    // Получаем информацию о товарах перед удалением для очистки изображений из Cloudinary
    const result = await supabaseWithRetry(supabase, (client) =>
      client
        .from('products')
        .select(`
          *,
          product_images(*)
        `)
        .in('id', productIds)
    ) as { data: any; error: any };

    const { data: productsToDelete, error: fetchError } = result;

    if (fetchError) {
      // If it's a permission error, try using service role client
      if (fetchError.code === '42501' || fetchError.message?.includes('permission denied')) {
        console.warn('Permission error detected, using service role client for products bulk fetch before deletion');
        const serviceRoleClient = createServiceRoleClient();

        const srFetchResult = await serviceRoleClient
          .from('products')
          .select(`
            *,
            product_images(*)
          `)
          .in('id', productIds);

        if (srFetchResult.error) {
          console.error('Ошибка получения информации о продуктах перед удалением через service role:', srFetchResult.error);
        } else {
          const srProductsToDelete = srFetchResult.data;
          
          // Удаляем изображения продуктов из Cloudinary
          for (const product of srProductsToDelete) {
            const imagesToDelete = product?.product_images || [];
            for (const image of imagesToDelete) {
              if (image.image_url) {
                try {
                  const { deleteImageFromCloudinaryByUrl } = await import('@/utils/cloudinary-helpers');
                  await deleteImageFromCloudinaryByUrl(image.image_url);
                } catch (cloudinaryError) {
                  console.error('Ошибка при удалении изображения из Cloudinary:', cloudinaryError);
                }
              }
            }
          }
        }
      } else {
        console.error('Ошибка получения информации о продуктах перед удалением:', fetchError);
      }
    } else {
      // Удаляем изображения продуктов из Cloudinary
      for (const product of productsToDelete) {
        const imagesToDelete = product?.product_images || [];
        for (const image of imagesToDelete) {
          if (image.image_url) {
            try {
              const { deleteImageFromCloudinaryByUrl } = await import('@/utils/cloudinary-helpers');
              await deleteImageFromCloudinaryByUrl(image.image_url);
            } catch (cloudinaryError) {
              console.error('Ошибка при удалении изображения из Cloudinary:', cloudinaryError);
            }
          }
        }
      }
    }

    // Получаем категории удаляемых продуктов для инвалидации кэша до удаления
    const categoryResult = await supabaseWithRetry(supabase, (client) =>
      client
        .from('products')
        .select('category_id')
        .in('id', productIds)
    ) as { data: any; error: any };

    const { data: productCategories, error: categoryFetchError } = categoryResult;

    // Удаляем продукты (каскадно удалятся связанные изображения и характеристики)
    const deleteResult = await supabaseWithRetry(supabase, (client) =>
      client
        .from('products')
        .delete()
        .in('id', productIds)
    ) as { data: any; error: any };

    const { error: deleteError } = deleteResult;

    if (deleteError) {
      // If it's a permission error, try using service role client
      if (deleteError.code === '42501' || deleteError.message?.includes('permission denied')) {
        console.warn('Permission error detected, using service role client for products bulk DELETE');
        const serviceRoleClient = createServiceRoleClient();

        const srDeleteResult = await serviceRoleClient
          .from('products')
          .delete()
          .in('id', productIds);

        if (srDeleteResult.error) {
          return Response.json({ error: srDeleteResult.error.message }, { status: 500 });
        }

        // Логируем удаление продуктов в аудите
        try {
          for (const productId of productIds) {
            await auditService.logDelete(adminUser.email || 'admin', 'products', productId, adminUser.id);
          }
        } catch (auditError) {
          console.error('Ошибка записи в аудит при удалении продуктов:', auditError);
        }

        // Инвалидируем кэш для админ панели товаров
        try {
          cacheManager.delete('admin_products_all');

          if (!categoryFetchError && productCategories) {
            // Инвалидируем кэш для всех затронутых категорий
            for (const productCategory of productCategories) {
              cacheManager.delete('admin_products_' + productCategory.category_id);
            }
          }
        } catch (cacheError) {
          console.error('Ошибка инвалидации кэша админ панели товаров:', cacheError);
        }

        return Response.json({ success: true, deletedCount: productIds.length });
      }

      return Response.json({ error: deleteError.message }, { status: 500 });
    }

    // Логируем удаление продуктов в аудите
    try {
      for (const productId of productIds) {
        await auditService.logDelete(adminUser.email || 'admin', 'products', productId, adminUser.id);
      }
    } catch (auditError) {
      console.error('Ошибка записи в аудит при удалении продуктов:', auditError);
    }

    // Инвалидируем кэш для админ панели товаров
    try {
      cacheManager.delete('admin_products_all');

      if (!categoryFetchError && productCategories) {
        // Инвалидируем кэш для всех затронутых категорий
        for (const productCategory of productCategories) {
          cacheManager.delete('admin_products_' + productCategory.category_id);
        }
      }
    } catch (cacheError) {
      console.error('Ошибка инвалидации кэша админ панели товаров:', cacheError);
    }

    return Response.json({ success: true, deletedCount: productIds.length });
  } catch (error: any) {
    console.error('Ошибка при массовом удалении продуктов:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}