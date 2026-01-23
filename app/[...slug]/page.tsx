import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PageRenderer from '@/components/PageRenderer';

// Генерация метаданных для страницы
export async function generateMetadata({ params }: { params: { slug: string[] } }): Promise<Metadata> {
  const slug = (await params).slug?.join('/') || '';

  if (!slug) {
    return {};
  }

  try {
    const { createClient } = await import('@/lib/supabase-server');
    const supabase = await createClient();

    const { data: page, error } = await supabase
      .from('pages')
      .select('title, slug')
      .eq('slug', slug)
      .single();

    if (error || !page) {
      return {};
    }

    return {
      title: page.title,
      description: `Информация о ${page.title}`,
    };
  } catch (error) {
    return {};
  }
}

async function getPageData(slug: string) {
  // Для серверных компонентов используем прямой вызов Supabase
  const { createClient } = await import('@/lib/supabase-server');
  const supabase = await createClient();

  // Получаем страницу по slug
  const { data: page, error: pageError } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', slug)
    .single();

  if (pageError || !page) {
    return null;
  }

  // Получаем блоки для страницы
  const { data: blocks, error: blocksError } = await supabase
    .from('page_blocks')
    .select('*')
    .eq('page_id', page.id)
    .order('sort_order', { ascending: true });

  if (blocksError) {
    return null;
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
    }
  }

  // Собираем данные в нужную структуру
  return {
    ...page,
    page_blocks: blocks.map((block: any) => ({
      ...block,
      page_block_images: images.filter((img: any) => img.block_id === block.id),
      page_block_links: links.filter((link: any) => link.block_id === block.id)
    }))
  };
}

export default async function DynamicPage({ params }: { params: { slug: string[] } }) {
  const slug = (await params).slug?.join('/') || '';

  // Не обрабатываем пустой слаг или системные маршруты
  if (!slug || ['admin', 'api', 'auth'].includes(slug)) {
    // Для всех маршрутов, которые не совпадают с другими маршрутами, возвращаем 404
    return notFound();
  }

  const page = await getPageData(slug);

  if (!page) {
    // Если страница не найдена в базе данных, возвращаем 404
    return notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageRenderer page={page} />
    </div>
  );
}