'use client';

import { Page } from '@/types';
import OptimizedImage from './OptimizedImage';

interface PageRendererProps {
  page: Page & {
    page_blocks: Array<{
      id: string;
      page_id: string;
      block_type: 'text' | 'photo' | 'links';
      title: string;
      content?: string;
      sort_order: number;
      created_at: string;
      updated_at: string;
      page_block_images?: Array<{
        id: string;
        block_id: string;
        image_url: string;
        layout_type: 'simple' | 'banner' | 'horizontal_pair' | 'horizontal_triple' | 'grid_four' | 'image_text_side';
        sort_order: number;
        created_at: string;
        updated_at: string;
      }> | null; // Может быть null если нет изображений
      page_block_links?: Array<{
        id: string;
        block_id: string;
        title: string;
        url: string;
        sort_order: number;
        created_at: string;
        updated_at: string;
      }> | null; // Может быть null если нет ссылок
    }>;
  };
}

export default function PageRenderer({ page }: PageRendererProps) {
  // Сортируем блоки по порядку
  const sortedBlocks = [...page.page_blocks].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="py-8 w-full">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-12 text-center font-[var(--font-jost)]">
          {page.title}
        </h1>

        <div className="space-y-16">
          {sortedBlocks.map((block) => (
            <div
              key={block.id}
              className="bg-white rounded-2xl shadow-lg p-6 md:p-8 transition-all duration-300 hover:shadow-xl"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8 text-center font-[var(--font-jost)] pb-4 border-b border-gray-100">
                {block.title}
              </h2>

              {block.block_type === 'text' && block.content && (
                <div className="prose prose-lg max-w-none mx-auto text-gray-700 font-[var(--font-pt-sans)]">
                  <p className="text-lg leading-relaxed whitespace-pre-line">{block.content}</p>
                </div>
              )}

              {block.block_type === 'photo' && block.page_block_images && block.page_block_images.length > 0 && (
                <div className="mb-6">
                  {renderPhotoBlock(block.page_block_images, block.content)}
                </div>
              )}

              {block.block_type === 'links' && block.page_block_links && block.page_block_links.length > 0 && (
                <div className="mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {block.page_block_links
                      .slice()
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map((link) => (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.02] border-l-4 border-l-blue-500"
                        >
                          <div className="flex items-center">
                            <div className="mr-3 text-blue-600">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <h3 className="font-semibold text-lg text-gray-800 font-[var(--font-jost)]">{link.title}</h3>
                          </div>
                        </a>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function renderPhotoBlock(
  images: Array<{
    id: string;
    image_url: string;
    layout_type: 'simple' | 'banner' | 'horizontal_pair' | 'horizontal_triple' | 'grid_four' | 'image_text_side';
    sort_order: number;
    is_main?: boolean;
  }> | null,
  content?: string
) {
  if (!images || images.length === 0) {
    return <div className="text-center py-12 text-gray-500">Нет изображений для отображения</div>;
  }

  // Сортируем изображения по порядку
  const sortedImages = [...images].sort((a, b) => a.sort_order - b.sort_order);

  // Находим главное изображение
  const mainImage = images.find(img => img.is_main) || sortedImages[0]; // Если нет главного, берем первое

  switch (sortedImages[0]?.layout_type) {
    case 'banner':
      // Баннер - одно большое изображение (главное)
      return (
        <div className="w-full overflow-hidden rounded-xl shadow-lg border border-gray-200">
          <div className="relative w-full aspect-video md:aspect-[21/9]">
            <OptimizedImage
              src={mainImage?.image_url || sortedImages[0].image_url}
              alt="Баннер"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
            />
          </div>
        </div>
      );

    case 'horizontal_pair':
      // Два фото горизонтально (первое - главное)
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sortedImages.slice(0, 2).map((image, index) => (
            <div key={image.id} className={`overflow-hidden rounded-xl shadow-md border transition-transform duration-300 hover:scale-[1.02] ${index === 0 ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}`}>
              <div className="relative w-full aspect-square">
                <OptimizedImage
                  src={image.image_url}
                  alt={`Изображение ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 50vw"
                />
              </div>
              {index === 0 && (
                <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                  Главное
                </div>
              )}
            </div>
          ))}
        </div>
      );

    case 'horizontal_triple':
      // Три фото горизонтально (первое - главное)
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sortedImages.slice(0, 3).map((image, index) => (
            <div key={image.id} className={`overflow-hidden rounded-xl shadow-md border transition-transform duration-300 hover:scale-[1.02] ${index === 0 ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}`}>
              <div className="relative w-full aspect-square">
                <OptimizedImage
                  src={image.image_url}
                  alt={`Изображение ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 33vw"
                />
              </div>
              {index === 0 && (
                <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                  Главное
                </div>
              )}
            </div>
          ))}
        </div>
      );

    case 'grid_four':
      // Четыре фото сеткой по два в ряд (первое - главное)
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {sortedImages.slice(0, 4).map((image, index) => (
            <div key={image.id} className={`overflow-hidden rounded-xl shadow-md border transition-transform duration-300 hover:scale-[1.02] ${index === 0 ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}`}>
              <div className="relative w-full aspect-square">
                <OptimizedImage
                  src={image.image_url}
                  alt={`Изображение ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 25vw"
                />
              </div>
              {index === 0 && (
                <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                  Главное
                </div>
              )}
            </div>
          ))}
        </div>
      );

    case 'image_text_side':
      // Фото и текст рядом (главное изображение и текст из content)
      return (
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="md:w-1/2 overflow-hidden rounded-xl shadow-lg border border-gray-200">
            <div className="relative w-full aspect-square md:aspect-video">
              <OptimizedImage
                src={mainImage?.image_url || sortedImages[0].image_url}
                alt="Изображение"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 50vw"
              />
            </div>
          </div>
          <div className="md:w-1/2 prose prose-lg max-w-none text-gray-700 font-[var(--font-pt-sans)]">
            {content && <p className="text-lg leading-relaxed whitespace-pre-line">{content}</p>}
          </div>
        </div>
      );

    case 'simple':
    default:
      // Простое - одно изображение (главное)
      return (
        <div className="overflow-hidden rounded-xl shadow-lg border border-gray-200 mx-auto max-w-4xl">
          <div className="relative w-full aspect-video">
            <OptimizedImage
              src={mainImage?.image_url || sortedImages[0].image_url}
              alt="Изображение"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
            />
          </div>
        </div>
      );
  }
}