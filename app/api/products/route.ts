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
    const limit = parseInt(searchParams.get('limit') || '20'); // Ограничение количества результатов
    const offset = parseInt(searchParams.get('offset') || '0'); // Пагинация

    // Ограничиваем максимальное количество результатов
    const maxLimit = 100;
    const safeLimit = Math.min(limit, maxLimit);

    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories!inner(id, name),
        product_images(*),
        product_specs(*)
      `, { count: 'exact' })
      .order('created_at', { ascending: false }) // Сортируем по дате создания, новые первыми
      .range(offset, offset + safeLimit - 1); // Добавляем пагинацию

    if (category_id) {
      query = query.eq('category_id', category_id);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`); // Поиск по названию (регистронезависимый)
    }

    const { data, error, count } = await query;

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
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// Создание нового товара
export async function POST(request: NextRequest) {
  try {
    const supabase = await createAPIClient(request);
    const body = await request.json();
    const { category_id, name, price } = body;

    const { data, error } = await supabase
      .from('products')
      .insert([{ category_id, name, price }]);

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