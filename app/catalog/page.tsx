import { Suspense } from 'react';
import ProductsGrid from '@/components/ProductsGrid';
import { createClient } from '@/lib/supabase-server';

interface CatalogPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const search = typeof searchParams.search === 'string' ? searchParams.search : undefined;
  const category_id = typeof searchParams.category_id === 'string' ? searchParams.category_id : undefined;

  // Если есть параметр поиска, покажем все товары с этим параметром поиска
  // Если есть category_id, покажем товары из этой категории
  // Если нет ни одного параметра, покажем все товары

  return (
    <div className="py-8 bg-white pt-24 md:pt-8"> {/* Добавлен отступ сверху для компенсации фиксированной кнопки "Фильтры" на мобильных устройствах */}
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