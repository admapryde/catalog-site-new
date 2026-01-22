import { NextRequest } from 'next/server';
import { createAPIClient, supabaseWithRetry } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createAPIClient(request);

    // Получаем количество товаров
    const productsResult = await supabaseWithRetry(supabase, (client) =>
      client
        .from('products')
        .select('*', { count: 'exact', head: true })
    ) as { count: number; error: any };

    const { count: productsCount, error: productsError } = productsResult;

    if (productsError) {
      throw productsError;
    }

    // Получаем количество категорий
    const categoriesResult = await supabaseWithRetry(supabase, (client) =>
      client
        .from('categories')
        .select('*', { count: 'exact', head: true })
    ) as { count: number; error: any };

    const { count: categoriesCount, error: categoriesError } = categoriesResult;

    if (categoriesError) {
      throw categoriesError;
    }

    // Получаем количество групп баннеров
    const bannerGroupsResult = await supabaseWithRetry(supabase, (client) =>
      client
        .from('banner_groups')
        .select('*', { count: 'exact', head: true })
    ) as { count: number; error: any };

    const { count: bannerGroupsCount, error: bannerGroupsError } = bannerGroupsResult;

    if (bannerGroupsError) {
      throw bannerGroupsError;
    }

    const stats = {
      products: productsCount || 0,
      categories: categoriesCount || 0,
      bannerGroups: bannerGroupsCount || 0
    };

    return new Response(JSON.stringify(stats), {
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