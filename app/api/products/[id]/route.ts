import { NextRequest } from 'next/server';
import { createAPIClient, supabaseWithRetry } from '@/lib/supabase-server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: productId } = await params;

    // Используем реальный Supabase клиент для API маршрутов
    const supabase = await createAPIClient(request);

    // Получаем продукт с изображениями и характеристиками
    const result = await supabaseWithRetry(supabase, (client) =>
      client
        .from('products')
        .select(`
          *,
          category:categories!inner(id, name),
          product_images(*),
          product_specs(*)
        `)
        .eq('id', productId)
        .single()
    ) as { data: any; error: any };

    const { data, error } = result;

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    // Преобразуем данные, чтобы соответствовать ожидаемой структуре Product
    const transformedProduct = {
      ...data,
      images: data.product_images || [],
      specs: data.product_specs || []
    };

    return Response.json(transformedProduct);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}