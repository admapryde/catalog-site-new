import { NextRequest } from 'next/server';
import { createAPIClient, supabaseWithRetry } from '@/lib/supabase-server';
import { getAdminSession } from '@/services/admin-auth-service';

export async function GET(request: NextRequest) {
  // Проверяем, что пользователь аутентифицирован как администратор
  const adminUser = await getAdminSession();
  if (!adminUser) {
    return Response.json({ error: 'Требуется аутентификация администратора' }, { status: 401 });
  }

  try {
    const supabase = await createAPIClient(request);

    // Получаем все страницы
    const { data: pages, error: pagesError } = await supabaseWithRetry(supabase, async (client) =>
      await client
        .from('pages')
        .select('*')
        .order('created_at', { ascending: true })
    );

    if (pagesError) {
      return Response.json({ error: pagesError.message }, { status: 500 });
    }

    // Получаем все блоки
    const { data: blocks, error: blocksError } = await supabaseWithRetry(supabase, async (client) =>
      await client
        .from('page_blocks')
        .select('*')
        .order('sort_order', { ascending: true })
    );

    if (blocksError) {
      return Response.json({ error: blocksError.message }, { status: 500 });
    }

    // Получаем все изображения
    const { data: images, error: imagesError } = await supabaseWithRetry(supabase, async (client) =>
      await client
        .from('page_block_images')
        .select('*')
        .order('sort_order', { ascending: true })
    );

    if (imagesError) {
      return Response.json({ error: imagesError.message }, { status: 500 });
    }

    // Получаем все ссылки
    const { data: links, error: linksError } = await supabaseWithRetry(supabase, async (client) =>
      await client
        .from('page_block_links')
        .select('*')
        .order('sort_order', { ascending: true })
    );

    if (linksError) {
      return Response.json({ error: linksError.message }, { status: 500 });
    }

    // Собираем данные в нужную структуру
    const pagesWithData = pages.map((page: any) => ({
      ...page,
      page_blocks: blocks
        .filter((block: any) => block.page_id === page.id)
        .map((block: any) => ({
          ...block,
          page_block_images: images.filter((img: any) => img.block_id === block.id),
          page_block_links: links.filter((link: any) => link.block_id === block.id)
        }))
    }));

    return Response.json(pagesWithData);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}