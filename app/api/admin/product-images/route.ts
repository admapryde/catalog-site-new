import { NextRequest } from 'next/server';
import { createAPIClient } from '@/lib/supabase-server';
import { getAdminSession } from '@/services/admin-auth-service';

export async function POST(request: NextRequest) {
  try {
    // Проверяем, что пользователь аутентифицирован как администратор
    const adminUser = await getAdminSession();
    if (!adminUser) {
      return Response.json({ error: 'Требуется аутентификация администратора' }, { status: 401 });
    }

    const body = await request.json();
    const { product_id, image_url, is_main } = body;

    // Проверяем, что product_id является валидным UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(product_id)) {
      return Response.json({ error: `Invalid product ID format: ${product_id}` }, { status: 400 });
    }

    // Проверяем, что image_url является допустимым URL
    try {
      new URL(image_url);
    } catch (e) {
      return Response.json({ error: `Invalid image URL: ${image_url}` }, { status: 400 });
    }

    // Используем реальный Supabase клиент для API маршрутов
    const supabase = await createAPIClient(request);

    // Проверим, существует ли продукт
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    // Если это главное изображение, сначала сбросим флаг is_main у других изображений
    if (is_main) {
      await supabase
        .from('product_images')
        .update({ is_main: false })
        .eq('product_id', product_id);
    }

    // Добавляем изображение
    const { data: imageData, error: imageError } = await supabase
      .from('product_images')
      .insert([{
        product_id,
        image_url,
        is_main
      }])
      .select()
      .single();

    if (imageError) {
      return Response.json({ error: imageError.message }, { status: 500 });
    }

    return Response.json(imageData);
  } catch (error: any) {
    console.error('Ошибка при добавлении изображения:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Проверяем, что пользователь аутентифицирован как администратор
    const adminUser = await getAdminSession();
    if (!adminUser) {
      return Response.json({ error: 'Требуется аутентификация администратора' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({ error: 'ID изображения не указан' }, { status: 400 });
    }

    // Используем реальный Supabase клиент для API маршрутов
    const supabase = await createAPIClient(request);

    // Получаем информацию об изображении перед удалением
    const { data: imageToDelete, error: fetchError } = await supabase
      .from('product_images')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      return Response.json({ error: 'Image not found' }, { status: 404 });
    }

    // Удаляем изображение
    const { error: deleteError } = await supabase
      .from('product_images')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return Response.json({ error: deleteError.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}