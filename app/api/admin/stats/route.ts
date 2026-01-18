import { NextRequest } from 'next/server';
import { createAPIClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createAPIClient(request);

    // Получаем количество товаров
    const { count: productsCount, error: productsError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (productsError) {
      throw productsError;
    }

    // Получаем количество категорий
    const { count: categoriesCount, error: categoriesError } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true });

    if (categoriesError) {
      throw categoriesError;
    }

    // Получаем количество групп баннеров
    const { count: bannerGroupsCount, error: bannerGroupsError } = await supabase
      .from('banner_groups')
      .select('*', { count: 'exact', head: true });

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