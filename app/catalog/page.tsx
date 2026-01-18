import ProductsGrid from '@/components/ProductsGrid';

export default function CatalogPage() {
  return (
    <div className="py-8 bg-white">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Каталог товаров</h1>
        <ProductsGrid />
      </div>
    </div>
  );
}