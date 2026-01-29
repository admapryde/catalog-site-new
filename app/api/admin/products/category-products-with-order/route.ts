import { NextRequest } from 'next/server';
import { createAPIClient, supabaseWithRetry } from '@/lib/supabase-server';

// Получение товаров категории с информацией о порядке
export async function GET(request: NextRequest) {
  try {
    const supabase = await createAPIClient(request);

    // Извлекаем параметры из URL
    const { searchParams } = new URL(request.url);
    const category_id = searchParams.get('category_id');

    if (!category_id) {
      return Response.json({ error: 'ID категории не предоставлен' }, { status: 400 });
    }

    // Запрашиваем товары с информацией о порядке в категории
    const { data, error } = await supabaseWithRetry(supabase, (client) =>
      client
        .from('products')
        .select(`
          *,
          category_product_order!left(category_id, product_id, sort_order)
        `)
        .eq('category_id', category_id)
        .order('category_product_order.sort_order', { ascending: true, nullsFirst: false })
        .then((query: any) =>
          query.order('created_at', { ascending: false })
        )
    ) as { data: any; error: any };

    if (error) {
      throw error;
    }

    // Преобразуем данные, чтобы соответствовать ожидаемой структуре Product
    const transformedData = data.map((item: any) => {
      // Извлекаем информацию о порядке из вложенного объекта
      const category_product_order = item.category_product_order?.[0] || null;
      
      return {
        ...item,
        category_product_order: category_product_order
      };
    });

    return Response.json(transformedData, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' // Кэширование на 5 минут
      }
    });
  } catch (error: any) {
    console.error('Ошибка получения товаров категории:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}