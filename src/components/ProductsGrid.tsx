import { Suspense } from 'react';
import ProductsGridContent from './ProductsGridContent';

export default function ProductsGrid({ categoryId }: { categoryId?: string }) {
  return (
    <Suspense fallback={<div>Загрузка товаров...</div>}>
      <ProductsGridContent categoryId={categoryId} />
    </Suspense>
  );
}