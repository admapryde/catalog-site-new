import { Suspense } from 'react';
import ProductsGridContent from './ProductsGridContent';

export default function ProductsGridWrapper({ categoryId, search }: { categoryId?: string; search?: string }) {
  return (
    <Suspense fallback={<div>Загрузка товаров...</div>}>
      <ProductsGridContent categoryId={categoryId} search={search} />
    </Suspense>
  );
}