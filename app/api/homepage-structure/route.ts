import { NextRequest } from 'next/server';
import { createAPIClient, supabaseWithRetry } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createAPIClient(request);

    // Получаем все активные и видимые блоки
    const blocksResult = await supabaseWithRetry(supabase, (client) =>
      client
        .from('homepage_blocks')
        .select('*')
        .eq('enabled', true)
        .eq('visible', true)
        .order('position', { ascending: true })
    );

    const { data: blocks, error: blocksError } = blocksResult as { data: any; error: any };

    if (blocksError) {
      throw blocksError;
    }

    // Возвращаем структуру главной страницы (только блоки)
    const homepageStructure = {
      blocks: blocks || [] // Убедимся, что возвращаем массив, даже если нет блоков
    };

    return Response.json(homepageStructure, {
      headers: {
        'X-Next-Cache-Tags': 'homepage_structure',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30'
      }
    });
  } catch (error: any) {
    console.error('Ошибка в API маршруте homepage-structure:', error);
    // Возвращаем пустую структуру в случае ошибки
    const emptyStructure = {
      blocks: []
    };

    return Response.json(emptyStructure, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30'
      },
      status: 500
    });
  }
}