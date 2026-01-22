import { NextRequest } from 'next/server';
import { createAPIClient, supabaseWithRetry } from '@/lib/supabase-server';
import { getAdminSession } from '@/services/admin-auth-service';
import { auditService } from '@/utils/audit-service';
import { cacheManager } from '@/utils/cache-manager';

// Кэшируем результаты запросов на 2 минуты
const CACHE_DURATION = 2 * 60 * 1000; // 2 минуты в миллисекундах

export async function GET(request: NextRequest) {
  // Проверяем, что пользователь аутентифицирован как администратор
  const adminUser = await getAdminSession();
  if (!adminUser) {
    return Response.json({ error: 'Требуется аутентификация администратора' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category_id');

    // Формируем ключ кэша на основе параметров запроса
    const cacheKey = `admin_products_${categoryId || 'all'}`;
    const cached = cacheManager.get<any[]>(cacheKey, CACHE_DURATION);

    // Проверяем, есть ли свежие данные в кэше
    if (cached) {
      const response = Response.json(cached);
      response.headers.set('Cache-Control', 'public, max-age=120'); // 2 минуты кэширования
      return response;
    }

    // Используем реальный Supabase клиент для API маршрутов
    const supabase = await createAPIClient(request);

    const result = await supabaseWithRetry(supabase, (client) =>
      client
        .from('products')
        .select(`
          *,
          category:categories!inner(id, name),
          product_images(*),
          product_specs(*)
        `)
        .order('created_at', { ascending: false })
    ) as { data: any; error: any };

    let { data, error } = result;

    if (categoryId) {
      const categoryResult = await supabaseWithRetry(supabase, (client) =>
        client
          .from('products')
          .select(`
            *,
            category:categories!inner(id, name),
            product_images(*),
            product_specs(*)
          `)
          .eq('category_id', categoryId)
          .order('created_at', { ascending: false })
      ) as { data: any; error: any };

      data = categoryResult.data;
      error = categoryResult.error;
    }

    if (error) {
      console.error('Ошибка получения товаров:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Преобразуем данные, чтобы соответствовать ожидаемой структуре Product
    const transformedData = data.map((item: any) => ({
      ...item,
      images: item.product_images || [],
      specs: item.product_specs || [],
      homepage_section_items: item.homepage_section_items || []
    }));

    // Сохраняем результат в кэш
    cacheManager.set(cacheKey, transformedData);

    const response = Response.json(transformedData);
    response.headers.set('Cache-Control', 'public, max-age=120'); // 2 минуты кэширования
    return response;
  } catch (error: any) {
    console.error('Ошибка получения товаров:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Проверяем, что пользователь аутентифицирован как администратор
    const adminUser = await getAdminSession();
    if (!adminUser) {
      return Response.json({ error: 'Требуется аутентификация администратора' }, { status: 401 });
    }

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
      // Проверяем, что переданные spec_type_id существуют в базе данных
      const specTypeIds = specs.map((spec: any) => spec.spec_type_id).filter(Boolean);

      if (specTypeIds.length > 0) {
        const { data: validSpecTypes, error: specTypesCheckError } = await supabase
          .from('spec_types')
          .select('id')
          .in('id', specTypeIds);

        if (specTypesCheckError) {
          return Response.json({ error: `Ошибка проверки типов характеристик: ${specTypesCheckError.message}` }, { status: 500 });
        }

        const validSpecTypeIds = validSpecTypes.map((st: any) => st.id);

        // Обновляем спецификации, устанавливая в null некорректные spec_type_id
        const validatedSpecs = specs.map((spec: any) => ({
          product_id: productId,
          property_name: spec.property_name,
          value: spec.value,
          spec_type_id: spec.spec_type_id && validSpecTypeIds.includes(spec.spec_type_id) ? spec.spec_type_id : null
        }));

        const { error: specsError } = await supabase
          .from('product_specs')
          .insert(validatedSpecs);

        if (specsError) {
          return Response.json({ error: specsError.message }, { status: 500 });
        }
      } else {
        // Если нет типов характеристик, просто вставляем без проверки
        const specsWithProductId = specs.map((spec: any) => ({
          product_id: productId,
          property_name: spec.property_name,
          value: spec.value,
          spec_type_id: null
        }));

        const { error: specsError } = await supabase
          .from('product_specs')
          .insert(specsWithProductId);

        if (specsError) {
          return Response.json({ error: specsError.message }, { status: 500 });
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
      .eq('id', productId)
      .single();

    if (fullProductError) {
      return Response.json({ error: fullProductError.message }, { status: 500 });
    }

    // Для POST запроса также получим информацию о типах характеристик
    const specTypeIds = fullProductData.product_specs?.map((spec: any) => spec.spec_type_id).filter(Boolean) || [];
    let specTypesMap: Record<string, any> = {};

    if (specTypeIds.length > 0) {
      const { data: specTypes, error: specTypesError } = await supabase
        .from('spec_types')
        .select('id, name, filter_type')
        .in('id', specTypeIds);

      if (specTypesError) {
        return Response.json({ error: `Ошибка получения типов характеристик: ${specTypesError.message}` }, { status: 500 });
      }

      specTypesMap = specTypes.reduce((acc: Record<string, any>, type) => {
        acc[type.id] = type;
        return acc;
      }, {});
    }

    // Преобразуем данные, чтобы соответствовать ожидаемой структуре Product
    const transformedProduct = {
      ...fullProductData,
      images: fullProductData.product_images || [],
      specs: fullProductData.product_specs?.map((spec: any) => {
        // Добавляем информацию о типе характеристики, если она доступна
        const specTypeInfo = spec.spec_type_id ? specTypesMap[spec.spec_type_id] : null;
        return {
          ...spec,
          spec_type: specTypeInfo || spec.spec_type,
          spec_type_id: spec.spec_type_id
        };
      }) || []
    };

    // Логируем создание продукта в аудите
    try {
      await auditService.logCreate('admin', 'products', productId);
    } catch (auditError) {
      console.error('Ошибка записи в аудит при создании продукта:', auditError);
    }

    /*
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
    */

    return Response.json(transformedProduct);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Проверяем, что пользователь аутентифицирован как администратор
    const adminUser = await getAdminSession();
    if (!adminUser) {
      return Response.json({ error: 'Требуется аутентификация администратора' }, { status: 401 });
    }

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

    // Получим информацию о типах характеристик для текущих спецификаций
    const currentSpecs = currentProduct.product_specs || [];
    const specTypeIds = currentSpecs.map((spec: any) => spec.spec_type_id).filter(Boolean);
    let specTypesMap: Record<string, any> = {};

    if (specTypeIds.length > 0) {
      const { data: specTypes, error: specTypesError } = await supabase
        .from('spec_types')
        .select('id, name, filter_type')
        .in('id', specTypeIds);

      if (specTypesError) {
        return Response.json({ error: `Ошибка получения типов характеристик: ${specTypesError.message}` }, { status: 500 });
      }

      specTypesMap = specTypes.reduce((acc: Record<string, any>, type) => {
        acc[type.id] = type;
        return acc;
      }, {});
    }

    // Обновляем изображения только если они были переданы в запросе
    if (images !== undefined) {
      // Сравним переданные изображения с текущими
      const currentImages = currentProduct.product_images || [];
      const imagesChanged = JSON.stringify(images.map((img: any) => ({
        image_url: img.image_url,
        is_main: img.is_main
      })).sort((a: any, b: any) => a.image_url.localeCompare(b.image_url))) !==
      JSON.stringify(currentImages.map((img: any) => ({
        image_url: img.image_url,
        is_main: img.is_main
      })).sort((a: any, b: any) => a.image_url.localeCompare(b.image_url)));

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
      const specsChanged = JSON.stringify(specs.map((spec: any) => ({
        property_name: spec.property_name,
        value: spec.value,
        spec_type_id: spec.spec_type_id || null
      })).sort((a: any, b: any) => a.property_name.localeCompare(b.property_name))) !==
      JSON.stringify(currentSpecs.map((spec: any) => ({
        property_name: spec.property_name,
        value: spec.value,
        spec_type_id: spec.spec_type_id || null
      })).sort((a: any, b: any) => a.property_name.localeCompare(b.property_name)));

      if (specsChanged) {
        // Удаляем старые характеристики
        await supabase
          .from('product_specs')
          .delete()
          .eq('product_id', id);

        // Добавляем новые характеристики
        if (specs.length > 0) {
          // Проверяем, что переданные spec_type_id существуют в базе данных
          const specTypeIds = specs.map((spec: any) => spec.spec_type_id).filter(Boolean);

          if (specTypeIds.length > 0) {
            const { data: validSpecTypes, error: specTypesCheckError } = await supabase
              .from('spec_types')
              .select('id')
              .in('id', specTypeIds);

            if (specTypesCheckError) {
              return Response.json({ error: `Ошибка проверки типов характеристик: ${specTypesCheckError.message}` }, { status: 500 });
            }

            const validSpecTypeIds = validSpecTypes.map((st: any) => st.id);

            // Обновляем спецификации, устанавливая в null некорректные spec_type_id
            const validatedSpecs = specs.map((spec: any) => ({
              product_id: id,
              property_name: spec.property_name,
              value: spec.value,
              spec_type_id: spec.spec_type_id && validSpecTypeIds.includes(spec.spec_type_id) ? spec.spec_type_id : null
            }));

            const { error: specsError } = await supabase
              .from('product_specs')
              .insert(validatedSpecs);

            if (specsError) {
              return Response.json({ error: specsError.message }, { status: 500 });
            }
          } else {
            // Если нет типов характеристик, просто вставляем без проверки
            const specsWithProductId = specs.map((spec: any) => ({
              product_id: id,
              property_name: spec.property_name,
              value: spec.value,
              spec_type_id: null
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
      specs: fullProductData.product_specs?.map((spec: any) => {
        // Добавляем информацию о типе характеристики, если она доступна
        const specTypeInfo = spec.spec_type_id ? specTypesMap[spec.spec_type_id] : null;
        return {
          ...spec,
          spec_type: specTypeInfo || spec.spec_type,
          spec_type_id: spec.spec_type_id
        };
      }) || []
    };

    // Логируем обновление продукта в аудите
    try {
      await auditService.logUpdate('admin', 'products', id);
    } catch (auditError) {
      console.error('Ошибка записи в аудит при обновлении продукта:', auditError);
    }

    /*
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
    */

    return Response.json(transformedProduct);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

import { deleteImageFromCloudinaryByUrl } from '@/utils/cloudinary-helpers';

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
      // Удаляем изображения продукта из Cloudinary
      const imagesToDelete = productToDelete?.product_images || [];
      for (const image of imagesToDelete) {
        if (image.image_url) {
          await deleteImageFromCloudinaryByUrl(image.image_url);
        }
      }
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

    /*
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
    */

    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}