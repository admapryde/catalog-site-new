import Link from 'next/link';
import OptimizedImage from '@/components/OptimizedImage';

interface Category {
  id: string;
  name: string;
  image_url: string;
  sort_order: number;
}

interface Product {
  id: string;
  category_id: string;
  name: string;
  price: number;
  images: {
    id: string;
    product_id: string;
    image_url: string;
    is_main: boolean;
  }[];
  specs?: {
    id: string;
    product_id: string;
    property_name: string;
    value: string;
  }[];
}

export default async function AllCategoriesPage() {
  let categories: Category[] = [];

  try {
    // Получаем категории напрямую через Supabase клиент
    const supabase = await import('@/lib/supabase-server').then(mod => mod.createClient());

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      throw error;
    }

    categories = data || [];
  } catch (error) {
    console.error('Ошибка загрузки категорий:', error);
    // В случае ошибки возвращаем пустой массив
    categories = [];
  }

  // Для каждой категории получаем товары
  const categoriesWithProducts = await Promise.all(
    categories.map(async (category) => {
      let products: Product[] = [];

      try {
        // Получаем товары для категории напрямую через Supabase клиент
        const supabase = await import('@/lib/supabase-server').then(mod => mod.createClient());

        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            product_images (*)
          `)
          .eq('category_id', category.id)
          .limit(8); // Ограничиваем количество товаров для отображения

        if (error) {
          throw error;
        }

        // Преобразуем данные для совместимости с интерфейсом Product
        products = (data || []).map(product => ({
          ...product,
          images: product.product_images || []
        }));
      } catch (error) {
        console.error(`Ошибка загрузки товаров для категории ${category.id}:`, error);
        products = []; // В случае ошибки возвращаем пустой массив
      }

      return {
        ...category,
        products,
      };
    })
  );

  // Сортировка по порядку
  const sortedCategoriesWithProducts = categoriesWithProducts.sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="py-8 pt-24 md:pt-8"> {/* Добавлен отступ сверху для компенсации фиксированной кнопки "Фильтры" на мобильных устройствах */}
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Все категории</h1>
        
        {sortedCategoriesWithProducts.map((category) => (
          <div key={category.id} className="mb-12">
            <div className="flex flex-col items-center justify-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 text-center">{category.name}</h2>
              <Link
                href={`/catalog/${category.id}`}
                className="text-blue-600 hover:text-blue-800 font-medium mt-2"
              >
                Смотреть все →
              </Link>
            </div>
            
            {category.products && category.products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {category.products.map((product) => {
                  const mainImage = product.images && Array.isArray(product.images)
                    ? (product.images.find(img => img.is_main) || product.images[0])
                    : null;

                  return (
                    <Link
                      href={`/product/${product.id}`}
                      key={product.id}
                      className="block group bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-lg hover:-translate-y-1"
                    >
                      <div className="relative pb-[100%]"> {/* Квадратный аспект */}
                        <OptimizedImage
                          src={mainImage ? mainImage.image_url : '/placeholder-product.jpg'}
                          alt={product.name}
                          fill
                          className="absolute h-full w-full object-cover"
                          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium text-gray-800 group-hover:text-blue-600 mb-2 line-clamp-2 h-12">{product.name}</h3>
                        <p className="text-lg font-bold text-gray-900">{product.price?.toLocaleString('ru-RU')} ₽</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 italic">В этой категории пока нет товаров</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

