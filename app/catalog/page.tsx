import { Suspense } from 'react';
import ProductsGrid from '@/components/ProductsGrid';
import { createClient } from '@/lib/supabase-server';

interface CatalogPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const awaitedSearchParams = await searchParams;
  const search = Array.isArray(awaitedSearchParams.search) ? awaitedSearchParams.search[0] : awaitedSearchParams.search;
  const category_id = Array.isArray(awaitedSearchParams.category_id) ? awaitedSearchParams.category_id[0] : awaitedSearchParams.category_id;

  // Если есть параметр поиска, покажем все товары с этим параметром поиска
  // Если есть category_id, покажем товары из этой категории
  // Если нет ни одного параметра, покажем все товары

  return (
    <div className="py-8 pt-24 md:pt-8"> {/* Убран bg-white, чтобы использовать фон из LayoutWrapper */}
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          {search ? `Результаты поиска: "${search}"` : 'Каталог товаров'}
        </h1>
        <Suspense fallback={<div>Загрузка товаров...</div>}>
          <ProductsGrid categoryId={category_id} search={search} />
        </Suspense>
      </div>
    </div>
  );
}