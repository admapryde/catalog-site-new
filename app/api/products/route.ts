import { NextRequest } from 'next/server';
import { createAPIClient, supabaseWithRetry } from '@/lib/supabase-server';

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

    // Сначала выполним основной запрос
    let baseQuery = supabase
      .from('products')
      .select(`
        *,
        category:categories!inner(id, name),
        product_images(*),
        product_specs(*)
      `, { count: 'exact' })
      .order('created_at', { ascending: false }); // Сортируем по дате создания, новые первыми

    // Применяем фильтры
    if (category_id) {
      baseQuery = baseQuery.eq('category_id', category_id);
    }

    if (price_from) {
      baseQuery = baseQuery.gte('price', parseFloat(price_from));
    }

    if (price_to) {
      baseQuery = baseQuery.lte('price', parseFloat(price_to));
    }

    if (search) {
      baseQuery = baseQuery.ilike('name', `%${search}%`); // Поиск по названию (регистронезависимый)
    }

    // Применяем фильтры по характеристикам
    let finalProductIds: string[] | null = null;

    if (Object.keys(specFilters).length > 0) {
      // Сначала получаем все ID товаров, удовлетворяющих фильтрам характеристик
      let filteredProductIds: string[] | null = null;

      for (const [propertyName, values] of Object.entries(specFilters)) {
        if (values.length > 0) {
          // Получаем ID товаров, которые имеют хотя бы одно из указанных значений для данной характеристики
          const idsResult = await supabaseWithRetry(supabase, (client) =>
            client
              .from('product_specs')
              .select('product_id', { count: 'exact' })
              .eq('property_name', propertyName)
              .in('value', values)
          ) as { data: any; error: any };

          const { data: matchingProductIds, error: idsError } = idsResult;

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

      finalProductIds = filteredProductIds;
    }

    // Собираем основной запрос с учетом всех фильтров
    let query = supabaseWithRetry(supabase, (client) =>
      client
        .from('products')
        .select(`
          *,
          category:categories!inner(id, name),
          product_images(*),
          product_specs(*)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
    );

    // Применяем фильтры
    if (category_id) {
      query = supabaseWithRetry(supabase, (client) =>
        client
          .from('products')
          .select(`
            *,
            category:categories!inner(id, name),
            product_images(*),
            product_specs(*)
          `, { count: 'exact' })
          .eq('category_id', category_id)
          .order('created_at', { ascending: false })
      );
    }

    if (price_from) {
      query = supabaseWithRetry(supabase, (client) =>
        client
          .from('products')
          .select(`
            *,
            category:categories!inner(id, name),
            product_images(*),
            product_specs(*)
          `, { count: 'exact' })
          .eq('category_id', category_id || '*')
          .gte('price', parseFloat(price_from))
          .order('created_at', { ascending: false })
      );
    }

    if (price_to) {
      query = supabaseWithRetry(supabase, (client) =>
        client
          .from('products')
          .select(`
            *,
            category:categories!inner(id, name),
            product_images(*),
            product_specs(*)
          `, { count: 'exact' })
          .eq('category_id', category_id || '*')
          .gte('price', parseFloat(price_from || '0'))
          .lte('price', parseFloat(price_to))
          .order('created_at', { ascending: false })
      );
    }

    if (search) {
      query = supabaseWithRetry(supabase, (client) =>
        client
          .from('products')
          .select(`
            *,
            category:categories!inner(id, name),
            product_images(*),
            product_specs(*)
          `, { count: 'exact' })
          .eq('category_id', category_id || '*')
          .gte('price', parseFloat(price_from || '0'))
          .lte('price', parseFloat(price_to || '999999'))
          .ilike('name', `%${search}%`)
          .order('created_at', { ascending: false })
      );
    }

    // Применяем фильтр по ID товаров, если он есть
    if (finalProductIds && finalProductIds.length > 0) {
      query = supabaseWithRetry(supabase, (client) =>
        client
          .from('products')
          .select(`
            *,
            category:categories!inner(id, name),
            product_images(*),
            product_specs(*)
          `, { count: 'exact' })
          .eq('category_id', category_id || '*')
          .gte('price', parseFloat(price_from || '0'))
          .lte('price', parseFloat(price_to || '999999'))
          .ilike('name', `%${search || '%'}%`)
          .in('id', finalProductIds)
          .order('created_at', { ascending: false })
      );
    }

    // Применяем пагинацию
    query = supabaseWithRetry(supabase, (client) =>
      client
        .from('products')
        .select(`
          *,
          category:categories!inner(id, name),
          product_images(*),
          product_specs(*)
        `, { count: 'exact' })
        .eq('category_id', category_id || '*')
        .gte('price', parseFloat(price_from || '0'))
        .lte('price', parseFloat(price_to || '999999'))
        .ilike('name', `%${search || '%'}%`)
        .in('id', finalProductIds || '*')
        .range(offset, offset + safeLimit - 1)
        .order('created_at', { ascending: false })
    );

    const result = await query as { data: any; error: any; count: number };
    const { data, error, count } = result;

    if (error) {
      throw error;
    }

    // Преобразуем данные, чтобы соответствовать ожидаемой структуре Product
    const transformedData = data.map((item: any) => {
      return {
        ...item,
        category: item.category || {},
        images: item.product_images || [],
        specs: item.product_specs || []
      };
    });

    // Добавляем заголовки для пагинации и кэширования
    const responseHeaders = new Headers();
    responseHeaders.set('X-Total-Count', count?.toString() || '0');
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

    const result = await supabaseWithRetry(supabase, (client) =>
      client
        .from('products')
        .insert([{ category_id, name, price }])
    ) as { data: any; error: any };

    const { data, error } = result;

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