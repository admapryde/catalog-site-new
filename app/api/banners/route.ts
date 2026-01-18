import { NextRequest } from 'next/server';
import { createAPIClient } from '@/lib/supabase-server';

// Получение всех баннеров с группами
export async function GET(request: NextRequest) {
  try {
    const supabase = await createAPIClient(request);

    const { data, error } = await supabase
      .from('banner_groups')
      .select(`
        *,
        banners(*)
      `)
      .order('position', { ascending: true }) // сортировка групп
      .order('sort_order', { foreignTable: 'banners', ascending: true }); // сортировка баннеров внутри групп

    if (error) {
      throw error;
    }

    return Response.json(data, {
      headers: {
        // Используем теги кэширования для возможности инвалидации
        'X-Next-Cache-Tags': 'homepage_banners',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' // Кэширование на 1 минуту
      }
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}