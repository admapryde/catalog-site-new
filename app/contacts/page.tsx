import { Metadata } from 'next';
import PageRenderer from '@/components/PageRenderer';

export const metadata: Metadata = {
  title: 'Контакты',
  description: 'Контактная информация нашей компании',
};

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

export default async function ContactsPage() {
  const page = await getPageData('contacts');

  if (!page) {
    // Если страница не найдена, показываем сообщение
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Контакты</h1>
        <div className="text-center text-gray-600">
          <p>Страница контактов еще не создана в админ-панели.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageRenderer page={page} />
    </div>
  );
}