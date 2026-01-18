import { NextRequest } from 'next/server';
import { createAPIClient } from '@/lib/supabase-server';
import { auditService } from '@/utils/audit-service';

export async function GET(request: NextRequest) {
  try {
    // Используем реальный Supabase клиент для API маршрутов
    const supabase = await createAPIClient(request);

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category_id');

    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories!inner(id, name),
        product_images(*),
        product_specs(*)
      `);

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Преобразуем данные, чтобы соответствовать ожидаемой структуре Product
    const transformedData = data.map(item => ({
      ...item,
      images: item.product_images || [],
      specs: item.product_specs || [],
      homepage_section_items: item.homepage_section_items || []
    }));

    return Response.json(transformedData);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category_id, name, price, description, images, specs } = body;

    // Проверяем, что category_id является валидным UUID (если передан)
    if (category_id) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(category_id)) {
        return Response.json({ error: `Invalid category ID format: ${category_id}` }, { status: 400 });
      }
    }

    // Используем реальный Supabase клиент для API маршрутов
    const supabase = await createAPIClient(request);

    // Создаем продукт
    const { data: productData, error: productError } = await supabase
      .from('products')
      .insert([{ category_id, name, price, description }])
      .select()
      .single();

    if (productError) {
      return Response.json({ error: productError.message }, { status: 500 });
    }

    const productId = productData.id;

    // Добавляем изображения
    if (images && images.length > 0) {
      // Проверяем структуру изображений и удаляем любые поля, которые могут быть неверного формата
      const imagesWithProductId = images.map((img: any) => {
        // Убедимся, что удаляем любые временные или неподдерживаемые поля
        const { id: imgId, created_at, updated_at, ...cleanImg } = img;

        return {
          ...cleanImg,
          product_id: productId
        };
      });

      const { error: imagesError } = await supabase
        .from('product_images')
        .insert(imagesWithProductId);

      if (imagesError) {
        return Response.json({ error: imagesError.message }, { status: 500 });
      }
    }

    // Добавляем характеристики
    if (specs && specs.length > 0) {
      const specsWithProductId = specs.map((spec: any) => ({
        ...spec,
        product_id: productId
      }));

      const { error: specsError } = await supabase
        .from('product_specs')
        .insert(specsWithProductId);

      if (specsError) {
        return Response.json({ error: specsError.message }, { status: 500 });
      }
    }

    // Возвращаем полные данные продукта
    const { data: fullProductData, error: fullProductError } = await supabase
      .from('products')
      .select(`
        *,
        category:categories!inner(id, name),
        product_images(*),
        product_specs(*),
        homepage_section_items!left(section_id)
      `)
      .eq('id', productId)
      .single();

    if (fullProductError) {
      return Response.json({ error: fullProductError.message }, { status: 500 });
    }

    // Преобразуем данные, чтобы соответствовать ожидаемой структуре Product
    const transformedProduct = {
      ...fullProductData,
      images: fullProductData.product_images || [],
      specs: fullProductData.product_specs || []
    };

    // Логируем создание продукта в аудите
    try {
      await auditService.logCreate('admin', 'products', productId);
    } catch (auditError) {
      console.error('Ошибка записи в аудит при создании продукта:', auditError);
    }

    // Инвалидируем кэш для разделов главной страницы, содержащих продукты
    try {
      const { revalidateTag, revalidatePath } = await import('next/cache');
      await Promise.allSettled([
        revalidateTag('homepage_sections'),
        revalidatePath('/'),
        revalidatePath('/api/homepage-sections'),
        revalidatePath('/api/products')
      ]);
    } catch (cacheError) {
      console.error('Ошибка инвалидации кэша разделов главной страницы:', cacheError);
    }

    return Response.json(transformedProduct);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, category_id, name, price, description, images, specs } = body;

    // Проверяем, что id является валидным UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return Response.json({ error: `Invalid product ID format: ${id}` }, { status: 400 });
    }

    // Используем реальный Supabase клиент для API маршрутов
    const supabase = await createAPIClient(request);

    // Получим текущие данные продукта перед обновлением
    const { data: currentProduct, error: fetchError } = await supabase
      .from('products')
      .select(`
        *,
        product_images(*),
        product_specs(*)
      `)
      .eq('id', id)
      .single();

    if (fetchError) {
      return Response.json({ error: fetchError.message }, { status: 500 });
    }

    // Подготовим обновление основного продукта
    const productUpdates: any = {};
    if (category_id !== undefined) productUpdates.category_id = category_id;
    if (name !== undefined) productUpdates.name = name;
    if (price !== undefined) productUpdates.price = price;
    if (description !== undefined) productUpdates.description = description;

    // Обновляем продукт только с теми полями, которые были переданы
    if (Object.keys(productUpdates).length > 0) {
      const { error: productError } = await supabase
        .from('products')
        .update(productUpdates)
        .eq('id', id);

      if (productError) {
        return Response.json({ error: productError.message }, { status: 500 });
      }
    }

    // Обновляем изображения только если они были переданы в запросе
    if (images !== undefined) {
      // Сравним переданные изображения с текущими
      const currentImages = currentProduct.product_images || [];
      const imagesChanged = JSON.stringify(images.map(img => ({
        image_url: img.image_url,
        is_main: img.is_main
      })).sort((a, b) => a.image_url.localeCompare(b.image_url))) !==
      JSON.stringify(currentImages.map(img => ({
        image_url: img.image_url,
        is_main: img.is_main
      })).sort((a, b) => a.image_url.localeCompare(b.image_url)));

      if (imagesChanged) {
        // Удаляем старые изображения
        await supabase
          .from('product_images')
          .delete()
          .eq('product_id', id);

        // Добавляем новые изображения
        if (images.length > 0) {
          // Проверяем структуру изображений и удаляем любые поля, которые могут быть неверного формата
          const imagesWithProductId = images.map((img: any) => {
            // Убедимся, что удаляем любые временные или неподдерживаемые поля
            const { id: imgId, created_at, updated_at, ...cleanImg } = img;

            return {
              ...cleanImg,
              product_id: id  // Use the product id, not the image id
            };
          });

          const { error: imagesError } = await supabase
            .from('product_images')
            .insert(imagesWithProductId);

          if (imagesError) {
            return Response.json({ error: imagesError.message }, { status: 500 });
          }
        }
      }
    }

    // Обновляем характеристики только если они были переданы в запросе
    if (specs !== undefined) {
      // Сравним переданные характеристики с текущими
      const currentSpecs = currentProduct.product_specs || [];
      const specsChanged = JSON.stringify(specs.map(spec => ({
        property_name: spec.property_name,
        value: spec.value
      })).sort((a, b) => a.property_name.localeCompare(b.property_name))) !==
      JSON.stringify(currentSpecs.map(spec => ({
        property_name: spec.property_name,
        value: spec.value
      })).sort((a, b) => a.property_name.localeCompare(b.property_name)));

      if (specsChanged) {
        // Удаляем старые характеристики
        await supabase
          .from('product_specs')
          .delete()
          .eq('product_id', id);

        // Добавляем новые характеристики
        if (specs.length > 0) {
          const specsWithProductId = specs.map((spec: any) => ({
            ...spec,
            product_id: id
          }));

          const { error: specsError } = await supabase
            .from('product_specs')
            .insert(specsWithProductId);

          if (specsError) {
            return Response.json({ error: specsError.message }, { status: 500 });
          }
        }
      }
    }

    // Возвращаем полные данные продукта
    const { data: fullProductData, error: fullProductError } = await supabase
      .from('products')
      .select(`
        *,
        category:categories!inner(id, name),
        product_images(*),
        product_specs(*),
        homepage_section_items!left(section_id)
      `)
      .eq('id', id)
      .single();

    if (fullProductError) {
      return Response.json({ error: fullProductError.message }, { status: 500 });
    }

    // Преобразуем данные, чтобы соответствовать ожидаемой структуре Product
    const transformedProduct = {
      ...fullProductData,
      images: fullProductData.product_images || [],
      specs: fullProductData.product_specs || []
    };

    // Логируем обновление продукта в аудите
    try {
      await auditService.logUpdate('admin', 'products', id);
    } catch (auditError) {
      console.error('Ошибка записи в аудит при обновлении продукта:', auditError);
    }

    // Инвалидируем кэш для разделов главной страницы, содержащих продукты
    try {
      const { revalidateTag, revalidatePath } = await import('next/cache');
      await Promise.allSettled([
        revalidateTag('homepage_sections'),
        revalidatePath('/'),
        revalidatePath('/api/homepage-sections'),
        revalidatePath('/api/products')
      ]);
    } catch (cacheError) {
      console.error('Ошибка инвалидации кэша разделов главной страницы:', cacheError);
    }

    return Response.json(transformedProduct);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({ error: 'ID продукта не указан' }, { status: 400 });
    }

    // Используем реальный Supabase клиент для API маршрутов
    const supabase = await createAPIClient(request);

    // Получаем информацию о продукте перед удалением для возможной очистки изображений из Cloudinary
    const { data: productToDelete, error: fetchError } = await supabase
      .from('products')
      .select(`
        *,
        product_images(*)
      `)
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Ошибка получения информации о продукте перед удалением:', fetchError);
    } else {
      // Здесь в будущем можно добавить логику удаления изображений из Cloudinary
      // const imagesToDelete = productToDelete?.product_images || [];
      // for (const image of imagesToDelete) {
      //   // Удалить изображение из Cloudinary по URL
      // }
    }

    // Удаляем продукт (каскадно удалятся связанные изображения и характеристики)
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return Response.json({ error: deleteError.message }, { status: 500 });
    }

    // Логируем удаление продукта в аудите
    try {
      await auditService.logDelete('admin', 'products', id);
    } catch (auditError) {
      console.error('Ошибка записи в аудит при удалении продукта:', auditError);
    }

    // Инвалидируем кэш для разделов главной страницы, содержащих продукты
    try {
      const { revalidateTag, revalidatePath } = await import('next/cache');
      await Promise.allSettled([
        revalidateTag('homepage_sections'),
        revalidatePath('/'),
        revalidatePath('/api/homepage-sections'),
        revalidatePath('/api/products')
      ]);
    } catch (cacheError) {
      console.error('Ошибка инвалидации кэша разделов главной страницы:', cacheError);
    }

    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}