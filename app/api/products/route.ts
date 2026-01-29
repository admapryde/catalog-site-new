import { NextRequest } from 'next/server';
import { createAPIClient } from '@/lib/supabase-server';

// Получение всех товаров с возможностью фильтрации по категории
export async function GET(request: NextRequest) {
  try {
    const supabase = await createAPIClient(request);

    // Извлекаем параметры из URL
    const { searchParams } = new URL(request.url);
    const category_id = searchParams.get('category_id');
    const search = searchParams.get('search');
    const price_from = searchParams.get('price_from');
    const price_to = searchParams.get('price_to');
    const limit = parseInt(searchParams.get('limit') || '20'); // Ограничение количества результатов
    const offset = parseInt(searchParams.get('offset') || '0'); // Пагинация

    // Ограничиваем максимальное количество результатов
    const maxLimit = 100;
    const safeLimit = Math.min(limit, maxLimit);

    // Извлекаем фильтры по характеристикам
    const specFilters: Record<string, string[]> = {};
    for (const [key, value] of searchParams.entries()) {
      if (key.startsWith('spec_')) {
        const propertyName = key.substring(5); // Удаляем 'spec_' префикс
        specFilters[propertyName] = value.split(',');
      }
    }

    // Сначала получаем товары
    let query = supabase
      .from('products')
      .select(`
        *
      `, { count: 'exact' });

    if (category_id) {
      query = query.eq('category_id', category_id);
    }

    // Выполняем основной запрос
    const { data: productsData, error: productsError, count: totalCount } = await query;

    if (productsError) {
      // Если ошибка связана с отсутствием таблицы category_product_order или неправильным синтаксисом, пробуем стандартный запрос
      if (productsError.code === '42P01' || productsError.message.includes('does not exist') || productsError.message.includes('syntax error')) {
        console.warn('Ошибка с запросом расширенной информации, используем стандартный запрос:', productsError.message);

        // Используем стандартный запрос без информации о порядке
        let standardQuery = supabase
          .from('products')
          .select(`
            *,
            category:categories!inner(id, name),
            product_images(*),
            product_specs(*)
          `, { count: 'exact' });

        // Сортируем по дате создания по умолчанию
        if (category_id) {
          standardQuery = standardQuery.eq('category_id', category_id);
        }
        standardQuery = standardQuery.order('created_at', { ascending: false });

        // Применяем фильтры
        if (price_from) {
          standardQuery = standardQuery.gte('price', parseFloat(price_from));
        }

        if (price_to) {
          standardQuery = standardQuery.lte('price', parseFloat(price_to));
        }

        if (search) {
          standardQuery = standardQuery.ilike('name', `%${search}%`);
        }

        // Применяем фильтры по характеристикам
        if (Object.keys(specFilters).length > 0) {
          let filteredProductIds: string[] | null = null;

          for (const [propertyName, values] of Object.entries(specFilters)) {
            if (values.length > 0) {
              // Получаем ID товаров, которые имеют хотя бы одно из указанных значений для данной характеристики
              const result = await supabase
                .from('product_specs')
                .select('product_id', { count: 'exact' })
                .eq('property_name', propertyName)
                .in('value', values);

              const { data: matchingProductIds, error: idsError } = result as { data: any; error: any };

              if (idsError) {
                throw idsError;
              }

              if (matchingProductIds && matchingProductIds.length > 0) {
                const currentProductIds = matchingProductIds.map((item: any) => item.product_id);

                // Если это первый фильтр, просто сохраняем ID
                if (filteredProductIds === null) {
                  filteredProductIds = currentProductIds;
                } else {
                  // Иначе находим пересечение с предыдущими результатами
                  filteredProductIds = filteredProductIds.filter(id => currentProductIds.includes(id));
                }
              } else {
                // Если нет подходящих товаров для одного из фильтров, возвращаем пустой результат
                return Response.json([], {
                  headers: {
                    'X-Total-Count': '0',
                    'X-Limit': safeLimit.toString(),
                    'X-Offset': offset.toString(),
                    'X-Next-Cache-Tags': 'homepage_products',
                    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60'
                  }
                });
              }
            }
          }

          // Применяем финальный фильтр по ID товаров
          if (filteredProductIds && filteredProductIds.length > 0) {
            standardQuery = standardQuery.in('id', filteredProductIds);
          } else if (filteredProductIds !== null && filteredProductIds.length === 0) {
            // Если в результате пересечений нет товаров, возвращаем пустой результат
            return Response.json([], {
              headers: {
                'X-Total-Count': '0',
                'X-Limit': safeLimit.toString(),
                'X-Offset': offset.toString(),
                'X-Next-Cache-Tags': 'homepage_products',
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60'
              }
            });
          }
        }

        // Применяем пагинацию
        standardQuery = standardQuery.range(offset, offset + safeLimit - 1);

        const standardResult = await standardQuery;
        const { data: standardData, error: standardError, count: standardCount } = standardResult as { data: any; error: any; count: number };

        if (standardError) {
          throw standardError;
        }

        // Преобразуем данные для стандартного ответа
        const standardTransformedData = standardData.map((item: any) => {
          return {
            ...item,
            category: item.category || {},
            images: item.product_images || [],
            specs: item.product_specs || [],
            category_product_order: null
          };
        });

        // Добавляем заголовки для пагинации и кэширования
        const standardResponseHeaders = new Headers();
        standardResponseHeaders.set('X-Total-Count', standardCount?.toString() || '0');
        standardResponseHeaders.set('X-Limit', safeLimit.toString());
        standardResponseHeaders.set('X-Offset', offset.toString());
        standardResponseHeaders.set('X-Next-Cache-Tags', 'homepage_products');
        standardResponseHeaders.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60'); // Кэширование на 5 минут

        return Response.json(standardTransformedData, {
          headers: standardResponseHeaders
        });
      } else {
        throw productsError;
      }
    }

    // Если есть category_id, получаем информацию о порядке из category_product_order
    let orderedProducts = productsData;
    if (category_id && productsData.length > 0) {
      // Получаем информацию о порядке для товаров в категории
      const productIds = productsData.map((p: any) => p.id);
      const { data: orderData, error: orderError } = await supabase
        .from('category_product_order')
        .select('product_id, sort_order')
        .in('product_id', productIds)
        .eq('category_id', category_id);

      if (orderError) {
        // Если ошибка получения порядка, просто сортируем по дате создания
        orderedProducts = productsData.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      } else {
        // Создаем маппинг id -> sort_order
        const orderMap: Record<string, number> = {};
        orderData.forEach((item: any) => {
          orderMap[item.product_id] = item.sort_order;
        });

        // Сортируем товары: сначала по sort_order (если есть), затем по дате создания
        orderedProducts = productsData.sort((a: any, b: any) => {
          const orderA = orderMap[a.id];
          const orderB = orderMap[b.id];

          // Если оба товара имеют порядок, сравниваем по sort_order
          if (orderA !== undefined && orderB !== undefined) {
            return orderA - orderB;
          }

          // Если только один имеет порядок, он идет первым
          if (orderA !== undefined) return -1;
          if (orderB !== undefined) return 1;

          // Если ни один не имеет порядка, сортируем по дате создания
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
      }
    } else if (!category_id) {
      // Если нет category_id, сортируем по дате создания
      orderedProducts = productsData.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    // Применяем фильтры к исходным данным
    if (price_from) {
      orderedProducts = orderedProducts.filter((p: any) => p.price >= parseFloat(price_from));
    }

    if (price_to) {
      orderedProducts = orderedProducts.filter((p: any) => p.price <= parseFloat(price_to));
    }

    if (search) {
      orderedProducts = orderedProducts.filter((p: any) => p.name.toLowerCase().includes(search.toLowerCase()));
    }

    // Применяем фильтры по характеристикам
    if (Object.keys(specFilters).length > 0) {
      let filteredProductIds: string[] | null = null;

      for (const [propertyName, values] of Object.entries(specFilters)) {
        if (values.length > 0) {
          // Получаем ID товаров, которые имеют хотя бы одно из указанных значений для данной характеристики
          const matchingProductIds = orderedProducts.filter((p: any) => {
            if (p.product_specs) {
              return p.product_specs.some((spec: any) =>
                spec.property_name === propertyName && values.includes(spec.value)
              );
            }
            return false;
          }).map((p: any) => p.id);

          if (matchingProductIds.length > 0) {
            // Если это первый фильтр, просто сохраняем ID
            if (filteredProductIds === null) {
              filteredProductIds = matchingProductIds;
            } else {
              // Иначе находим пересечение с предыдущими результатами
              filteredProductIds = filteredProductIds.filter(id => matchingProductIds.includes(id));
            }
          } else {
            // Если нет подходящих товаров для одного из фильтров, возвращаем пустой результат
            return Response.json([], {
              headers: {
                'X-Total-Count': '0',
                'X-Limit': safeLimit.toString(),
                'X-Offset': offset.toString(),
                'X-Next-Cache-Tags': 'homepage_products',
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60'
              }
            });
          }
        }
      }

      // Применяем финальный фильтр по ID товаров
      if (filteredProductIds && filteredProductIds.length > 0) {
        orderedProducts = orderedProducts.filter((p: any) => filteredProductIds.includes(p.id));
      } else if (filteredProductIds !== null && filteredProductIds.length === 0) {
        // Если в результате пересечений нет товаров, возвращаем пустой результат
        return Response.json([], {
          headers: {
            'X-Total-Count': '0',
            'X-Limit': safeLimit.toString(),
            'X-Offset': offset.toString(),
            'X-Next-Cache-Tags': 'homepage_products',
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60'
          }
        });
      }
    }

    // Применяем пагинацию
    const paginatedProducts = orderedProducts.slice(offset, offset + safeLimit);

    // Загружаем дополнительные данные (категории, изображения, характеристики)
    const productIds = paginatedProducts.map((p: any) => p.id);

    // Загружаем категории
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('id, name')
      .in('id', [...new Set(paginatedProducts.map((p: any) => p.category_id))]);

    const categoriesMap: Record<string, any> = {};
    categoriesData?.forEach((cat: any) => {
      categoriesMap[cat.id] = cat;
    });

    // Загружаем изображения
    let productImages = [];
    if (productIds.length > 0) {
      const { data: imagesData } = await supabase
        .from('product_images')
        .select('*')
        .in('product_id', productIds);
      productImages = imagesData || [];
    }

    // Загружаем характеристики
    let productSpecs = [];
    if (productIds.length > 0) {
      const { data: specsData } = await supabase
        .from('product_specs')
        .select('*')
        .in('product_id', productIds);
      productSpecs = specsData || [];
    }

    // Загружаем информацию о порядке в категории
    let categoryProductOrders: any[] = [];
    if (category_id && productIds.length > 0) {
      const { data: ordersData } = await supabase
        .from('category_product_order')
        .select('product_id, sort_order')
        .eq('category_id', category_id)
        .in('product_id', productIds);
      categoryProductOrders = ordersData || [];
    }

    // Группируем данные
    const imagesByProduct: Record<string, any[]> = {};
    productImages.forEach((img: any) => {
      if (!imagesByProduct[img.product_id]) {
        imagesByProduct[img.product_id] = [];
      }
      imagesByProduct[img.product_id].push(img);
    });

    const specsByProduct: Record<string, any[]> = {};
    productSpecs.forEach((spec: any) => {
      if (!specsByProduct[spec.product_id]) {
        specsByProduct[spec.product_id] = [];
      }
      specsByProduct[spec.product_id].push(spec);
    });

    const ordersByProduct: Record<string, any> = {};
    categoryProductOrders.forEach((order: any) => {
      ordersByProduct[order.product_id] = order;
    });

    // Преобразуем данные, чтобы соответствовать ожидаемой структуре Product
    const transformedData = paginatedProducts.map((item: any) => {
      return {
        ...item,
        category: categoriesMap[item.category_id] || { id: item.category_id, name: '' },
        images: imagesByProduct[item.id] || [],
        specs: specsByProduct[item.id] || [],
        category_product_order: ordersByProduct[item.id] || null
      };
    });

    // Добавляем заголовки для пагинации и кэширования
    const responseHeaders = new Headers();
    responseHeaders.set('X-Total-Count', totalCount?.toString() || '0');
    responseHeaders.set('X-Limit', safeLimit.toString());
    responseHeaders.set('X-Offset', offset.toString());
    responseHeaders.set('X-Next-Cache-Tags', 'homepage_products');
    responseHeaders.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60'); // Кэширование на 5 минут

    return Response.json(transformedData, {
      headers: responseHeaders
    });
  } catch (error: any) {
    console.error('Ошибка получения товаров:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// Создание нового товара
export async function POST(request: NextRequest) {
  try {
    const supabase = await createAPIClient(request);
    const body = await request.json();
    const { category_id, name, price } = body;

    const result = await supabase
      .from('products')
      .insert([{ category_id, name, price }]);

    const { data, error } = result as { data: any; error: any };

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}