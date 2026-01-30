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

export async function POST(request: NextRequest) {
  try {
    // Проверяем, что пользователь аутентифицирован как администратор
    const adminUser = await getAdminSessionFromRequest(request);
    if (!adminUser) {
      return Response.json({ error: 'Требуется аутентификация администратора' }, { status: 401 });
    }

    const body = await request.json();
    const { productId, images } = body;

    if (!productId) {
      return Response.json({ error: 'Необходимо указать ID продукта' }, { status: 400 });
    }

    if (!Array.isArray(images) || images.length === 0) {
      return Response.json({ error: 'Необходимо предоставить массив изображений' }, { status: 400 });
    }

    // Проверяем, что productId является валидным UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(productId)) {
      return Response.json({ error: `Invalid product ID format: ${productId}` }, { status: 400 });
    }

    // Используем реальный Supabase клиент для API маршрутов
    const supabase = await createAPIClient(request);

    // Подготовим изображения для вставки
    const imagesToInsert = images.map((img: any) => ({
      product_id: productId,
      image_url: img.image_url,
      is_main: img.is_main
    }));

    // Вставляем все изображения за один запрос
    const result = await supabaseWithRetry(supabase, (client) =>
      client
        .from('product_images')
        .insert(imagesToInsert)
        .select()
    ) as { data: any; error: any };

    const { data: insertedImages, error: insertError } = result;

    if (insertError) {
      // If it's a permission error, try using service role client
      if (insertError.code === '42501' || insertError.message?.includes('permission denied')) {
        console.warn('Permission error detected, using service role client for product images POST');
        const serviceRoleClient = createServiceRoleClient();

        const srResult = await serviceRoleClient
          .from('product_images')
          .insert(imagesToInsert)
          .select();

        if (srResult.error) {
          console.error('Ошибка при вставке изображений через service role:', srResult.error);
          return Response.json({ error: srResult.error.message }, { status: 500 });
        }

        const insertedImages = srResult.data;

        // Логируем добавление изображений в аудите
        try {
          await auditService.logUpdate(adminUser.email || 'admin', 'product_images', productId, adminUser.id);
        } catch (auditError) {
          console.error('Ошибка записи в аудит при добавлении изображений:', auditError);
        }

        return Response.json(insertedImages);
      }

      console.error('Ошибка при вставке изображений:', insertError);
      return Response.json({ error: insertError.message }, { status: 500 });
    }

    // Логируем добавление изображений в аудите
    try {
      await auditService.logUpdate(adminUser.email || 'admin', 'product_images', productId, adminUser.id);
    } catch (auditError) {
      console.error('Ошибка записи в аудит при добавлении изображений:', auditError);
    }

    return Response.json(insertedImages);
  } catch (error: any) {
    console.error('Ошибка при добавлении изображений к продукту:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}