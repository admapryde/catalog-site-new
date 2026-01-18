import { NextRequest } from 'next/server';
import { createAPIClient } from '@/lib/supabase-server';

// Получение всех категорий
export async function GET(request: NextRequest) {
  try {
    const supabase = await createAPIClient(request);

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      throw error;
    }

    return Response.json(data, {
      headers: {
        // Используем теги кэширования для возможности инвалидации
        'X-Next-Cache-Tags': 'homepage_categories',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' // Кэширование на 1 минуту
      }
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// Создание новой категории
export async function POST(request: NextRequest) {
  try {
    const supabase = await createAPIClient(request);
    const body = await request.json();
    const { name, image_url, sort_order } = body;

    const { data, error } = await supabase
      .from('categories')
      .insert([{ name, image_url, sort_order: sort_order || 0 }]);

    if (error) {
      throw error;
    }

    return Response.json(data);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}