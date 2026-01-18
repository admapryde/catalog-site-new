import { notFound } from 'next/navigation';
import OptimizedImage from '@/components/OptimizedImage';

export default async function ProductPage({ params }: { params: { id: string } }) {
  // Используем React.use() для разрешения промиса params
  const productId = (await params).id;

  let product: any;

  try {
    // Получаем продукт напрямую через Supabase клиент
    const supabase = await import('@/lib/supabase-server').then(mod => mod.createClient());

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories (name),
        product_images (*)
      `)
      .eq('id', productId)
      .single();

    if (error) {
      throw error;
    }

    product = data;
  } catch (error) {
    console.error('Product fetch error:', error);
    notFound();
  }

  const mainImage = product.images && Array.isArray(product.images)
    ? (product.images.find((img: any) => img.is_main) || product.images[0])
    : null;
  const thumbnailImages = product.images && Array.isArray(product.images)
    ? product.images.filter((img: any) => !img.is_main)
    : [];

  return (
    <div className="py-8 bg-gray-100">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <nav className="text-sm">
            <ol className="flex items-center space-x-2">
              <li><a href="/" className="text-blue-600 hover:underline">Главная</a></li>
              <li>/</li>
              <li>
                {product.category.id ? (
                  <a href={`/catalog/${product.category.id}`} className="text-blue-600 hover:underline">
                    {product.category.name}
                  </a>
                ) : (
                  <span className="text-gray-400 cursor-not-allowed" title="Категория не найдена">
                    {product.category.name}
                  </span>
                )}
              </li>
              <li>/</li>
              <li className="text-gray-500">{product.name}</li>
            </ol>
          </nav>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 p-8">
            {/* Левая колонка (медиа) */}
            <div>
              <div className="mb-4">
                <OptimizedImage
                  src={mainImage ? mainImage.image_url : '/placeholder-product.jpg'}
                  alt={product.name}
                  width={600}
                  height={600}
                  className="w-full h-auto rounded-lg object-cover"
                />
              </div>

              {thumbnailImages.length > 0 && (
                <div className="flex space-x-4 overflow-x-auto pb-2">
                  {thumbnailImages.map((image: any) => (
                    <div key={image.id} className="flex-shrink-0">
                      <OptimizedImage
                        src={image.image_url}
                        alt={`Миниатюра ${image.id}`}
                        width={80}
                        height={80}
                        className="w-20 h-20 object-cover rounded cursor-pointer border-2 border-transparent hover:border-blue-500"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Правая колонка (информация) */}
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-4">{product.name}</h1>

              <div className="mb-6">
                <p className="text-3xl font-bold text-gray-900">{product.price.toLocaleString('ru-RU')} ₽</p>
              </div>

              {product.description && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Описание</h2>
                  <div className="prose max-w-none text-gray-700">
                    {product.description}
                  </div>
                </div>
              )}

              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Характеристики</h2>
                <div className="grid grid-cols-1 gap-3">
                  {product.specs.map((spec: any) => (
                    <div key={spec.id} className="flex border-b border-gray-100 py-2">
                      <span className="text-gray-600">{spec.property_name}:</span>
                      <span className="font-medium text-gray-800 ml-2">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-4">
                <button className="border border-gray-300 hover:border-gray-400 text-gray-700 font-medium py-3 px-6 rounded-lg transition">
                  В избранное
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}