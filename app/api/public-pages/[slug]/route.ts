import { NextRequest } from 'next/server';
import { createAPIClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // В Next.js 16.1.1 параметры маршрута являются Promise и должны быть разрешены
    const resolvedParams = await params;
    const slug = resolvedParams.slug;

    const supabase = await createAPIClient(request);

    // Получаем страницу по slug
    const { data: page, error: pageError } = await supabase
      .from('pages')
      .select('*')
      .eq('slug', slug)
      .single();

    if (pageError || !page) {
      console.log(`Страница с slug "${slug}" не найдена в базе данных`, pageError);
      return Response.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    console.log(`Найдена страница с slug "${slug}", is_public:`, page.is_public);

    // Проверяем, является ли страница публичной
    // Если поле is_public отсутствует или равно true, считаем страницу публичной
    // Если поле is_public равно false, требуем аутентификацию
    if (page.is_public === false) {
      // Если страница помечена как непубличная, проверяем аутентификацию
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.log(`Доступ к приватной странице с slug "${slug}" запрещен для неавторизованного пользователя`);
        return Response.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      console.log(`Доступ к приватной странице с slug "${slug}" разрешен для авторизованного пользователя`);
    } else {
      console.log(`Страница с slug "${slug}" является публичной, доступ разрешен`);
    }

    // Получаем блоки для страницы
    const { data: blocks, error: blocksError } = await supabase
      .from('page_blocks')
      .select('*')
      .eq('page_id', page.id)
      .order('sort_order', { ascending: true });

    if (blocksError) {
      console.error(`Ошибка загрузки блоков для страницы с slug "${slug}":`, blocksError);
      return Response.json(
        { error: 'Failed to load page blocks' },
        { status: 500 }
      );
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

      if (!imagesError) {
        images = imagesData;
      } else {
        console.error(`Ошибка загрузки изображений для страницы с slug "${slug}":`, imagesError);
      }
    }

    // Получаем ссылки для всех блоков
    let links: any[] = [];
    if (blockIds.length > 0) {
      const { data: linksData, error: linksError } = await supabase
        .from('page_block_links')
        .select('*')
        .in('block_id', blockIds)
        .order('sort_order', { ascending: true });

      if (!linksError) {
        links = linksData;
      } else {
        console.error(`Ошибка загрузки ссылок для страницы с slug "${slug}":`, linksError);
      }
    }

    // Собираем данные в нужную структуру
    const pageData = {
      ...page,
      page_blocks: blocks.map((block: any) => ({
        ...block,
        page_block_images: images.filter((img: any) => img.block_id === block.id),
        page_block_links: links.filter((link: any) => link.block_id === block.id)
      }))
    };

    console.log(`Данные для страницы с slug "${slug}" успешно собраны`);

    // Устанавливаем кэширование для публичных страниц
    const response = Response.json(pageData);
    if (page.is_public !== false) { // Если страница публична (или поле отсутствует)
      response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400'); // Кэшируем на 1 час
      console.log(`Страница с slug "${slug}" будет кэшироваться`);
    }

    return response;
  } catch (error) {
    console.error('Ошибка получения данных страницы:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Ограничиваем другие HTTP методы
export async function POST() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}