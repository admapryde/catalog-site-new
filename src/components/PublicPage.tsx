'use client';

import { useState, useEffect } from 'react';
import PageRenderer from '@/components/PageRenderer';
import { Page } from '@/types';

interface PublicPageProps {
  slug: string;
}

export default function PublicPage({ slug }: PublicPageProps) {
  // Определяем тип страницы с блоками, как того ожидает PageRenderer
  interface PageWithBlocks extends Page {
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
        text_content?: string;
        sort_order: number;
        created_at: string;
        updated_at: string;
      }> | null;
      page_block_links?: Array<{
        id: string;
        block_id: string;
        title: string;
        url: string;
        sort_order: number;
        created_at: string;
        updated_at: string;
      }> | null;
    }>;
  }

  const [page, setPage] = useState<PageWithBlocks | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/public-pages/${slug}`);

        if (!response.ok) {
          if (response.status === 404) {
            // Страница не найдена
            console.log(`Страница с slug "${slug}" не найдена`);
            setPage(null);
          } else if (response.status === 401) {
            // Требуется аутентификация - это нормальное поведение для приватных страниц
            console.log(`Для страницы с slug "${slug}" требуется аутентификация`);
            setPage(null);
          } else {
            throw new Error(`Ошибка загрузки страницы: ${response.status} ${response.statusText}`);
          }
        } else {
          const data = await response.json();
          console.log(`Страница с slug "${slug}" успешно загружена`, data);
          setPage(data);
        }
      } catch (err: any) {
        setError(err.message);
        console.error('Ошибка загрузки страницы:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded w-1/3 mx-auto mb-12"></div>
          <div className="space-y-16">
            <div className="bg-white/85 rounded-2xl shadow-lg p-6 md:p-8">
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-8"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          <p>Ошибка загрузки страницы: {error}</p>
        </div>
      </div>
    );
  }

  if (!page) {
    // Если страница не найдена или требует аутентификации
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-600">
          <p>Страница "{slug}" еще не создана в админ-панели.</p>
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