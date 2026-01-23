import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return Response.json({ error: 'Slug параметр обязателен' }, { status: 400 });
    }

    // Получаем страницу по slug
    const { data: page, error: pageError } = await supabase
      .from('pages')
      .select('*')
      .eq('slug', slug)
      .single();

    if (pageError || !page) {
      return Response.json({ error: 'Страница не найдена' }, { status: 404 });
    }

    // Получаем блоки для страницы
    const { data: blocks, error: blocksError } = await supabase
      .from('page_blocks')
      .select('*')
      .eq('page_id', page.id)
      .order('sort_order', { ascending: true });

    if (blocksError) {
      return Response.json({ error: blocksError.message }, { status: 500 });
    }

    // Получаем изображения для всех блоков
    const blockIds = blocks.map((block: any) => block.id);
    let images: any[] = [];
    if (blockIds.length > 0) {
      const { data: imagesData, error: imagesError } = await supabase
        .from('page_block_images')
        .select('*')
        .in('block_id', blockIds)
        .order('sort_order', { ascending: true });

      if (imagesError) {
        return Response.json({ error: imagesError.message }, { status: 500 });
      }

      images = imagesData;
    }

    // Получаем ссылки для всех блоков
    let links: any[] = [];
    if (blockIds.length > 0) {
      const { data: linksData, error: linksError } = await supabase
        .from('page_block_links')
        .select('*')
        .in('block_id', blockIds)
        .order('sort_order', { ascending: true });

      if (linksError) {
        return Response.json({ error: linksError.message }, { status: 500 });
      }

      links = linksData;
    }

    // Собираем данные в нужную структуру
    const pageWithData = {
      ...page,
      page_blocks: blocks.map((block: any) => ({
        ...block,
        page_block_images: images.filter((img: any) => img.block_id === block.id),
        page_block_links: links.filter((link: any) => link.block_id === block.id)
      }))
    };

    return Response.json(pageWithData);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}