import { NextRequest } from 'next/server';
import { createAPIClient, supabaseWithRetry } from '@/lib/supabase-server';

// Получение всех категорий
export async function GET(request: NextRequest) {
  try {
    const supabase = await createAPIClient(request);

    const result = await supabaseWithRetry(supabase, (client) =>
      client
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true })
    ) as { data: any; error: any };

    const { data, error } = result;

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

    const result = await supabaseWithRetry(supabase, (client) =>
      client
        .from('categories')
        .insert([{ name, image_url, sort_order: sort_order || 0 }])
    ) as { data: any; error: any };

    const { data, error } = result;

    if (error) {
      throw error;
    }

    return Response.json(data);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}