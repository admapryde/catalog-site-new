import { NextRequest } from 'next/server';
import { createAPIClient, createStorageClient, supabaseWithRetry } from '@/lib/supabase-server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createAPIClient(request);

    // Получаем только основную информацию о разделах
    const sectionsResult = await supabaseWithRetry(supabase, (client) =>
      client
        .from('homepage_sections')
        .select('id, title, position, created_at, updated_at')
        .order('position', { ascending: true })
    );

    const { data: sections, error: sectionsError } = sectionsResult as { data: any; error: any };

    if (sectionsError) {
      throw sectionsError;
    }

    // Для каждого раздела получаем его элементы
    const sectionsWithItems = await Promise.all(sections.map(async (section: any) => {
      // Получаем элементы для текущего раздела (ограничиваем количество)
      const itemsResult = await supabaseWithRetry(supabase, (client) =>
        client
          .from('homepage_section_items')
          .select('id, section_id, product_id, sort_order')
          .eq('section_id', section.id)
          .order('sort_order', { ascending: true })
          .limit(10) // Ограничиваем количество элементов на раздел
      );

      const { data: items, error: itemsError } = itemsResult as { data: any; error: any };

      if (itemsError) {
        console.error(`Ошибка получения элементов для раздела ${section.id}:`, itemsError);
        return { ...section, items: [] };
      }

      // Получаем информацию о продуктах для элементов
      if (items && items.length > 0) {
        const productIds = items.map((item: any) => item.product_id);
        const productsResult = await supabaseWithRetry(supabase, (client) =>
          client
            .from('products')
            .select('id, name, price, category_id') // Без описания
            .in('id', productIds)
        );

        const { data: products, error: productsError } = productsResult as { data: any; error: any };

        if (productsError) {
          console.error(`Ошибка получения продуктов для раздела ${section.id}:`, productsError);
          return { ...section, items: [] };
        }

        // Создаем маппинг продуктов для быстрого доступа
        const productsMap = products.reduce((acc: Record<string, any>, product: any) => {
          acc[product.id] = product;
          return acc;
        }, {} as Record<string, any>);

        // Получаем все изображения для продуктов (не только главные)
        const allImagesResult = await supabaseWithRetry(supabase, (client) =>
          client
            .from('product_images')
            .select('product_id, image_url')
            .in('product_id', productIds)
        );

        const { data: allImages, error: allImagesError } = allImagesResult as { data: any; error: any };

        if (allImagesError) {
          console.error(`Ошибка получения изображений для раздела ${section.id}:`, allImagesError);
        }

        // Создаем маппинг изображений, отдавая предпочтение главным
        const imagesMap = allImages?.reduce((acc: Record<string, string>, img: any) => {
          if (img.image_url) {
            // Проверяем, не является ли URL base64-данными (обычно начинаются с 'data:image/')
            if (img.image_url.startsWith('data:image/')) {
              console.warn(`Найдены base64-данные изображения для продукта ${img.product_id}, пропускаем`);
            } else if (img.image_url.length > 5000) {
              console.warn(`Слишком длинный URL изображения для продукта ${img.product_id}: ${img.image_url.length} символов`);
            } else {
              // Если у нас еще нет изображения для этого продукта, сохраняем его
              if (!acc[img.product_id]) {
                // Если image_url - это путь к файлу в Storage, а не полный URL,
                // то нужно сгенерировать публичный URL
                if (!img.image_url.startsWith('http')) {
                  // Предполагаем, что img.image_url - это путь к файлу в Storage
                  // Генерируем публичный URL с помощью Storage API
                  acc[img.product_id] = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${img.image_url}`;
                } else {
                  acc[img.product_id] = img.image_url; // Возвращаем корректный URL
                }
              }
            }
          }
          return acc;
        }, {} as Record<string, string>) || {};

        // Формируем элементы с продуктами
        const itemsWithProducts = items.map((item: any) => ({
          ...item,
          product: {
            ...productsMap[item.product_id],
            description: '', // Добавляем пустое описание для совместимости
            images: imagesMap[item.product_id]
              ? [{ id: `main-${item.product_id}`, image_url: imagesMap[item.product_id], is_main: true }]
              : []
          }
        }));

        return { ...section, items: itemsWithProducts };
      } else {
        return { ...section, items: [] };
      }
    }));

    return Response.json(sectionsWithItems, {
      headers: {
        'X-Next-Cache-Tags': 'homepage_sections',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30'
      }
    });
  } catch (error: any) {
    console.error('Ошибка в API маршруте homepage-sections:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}