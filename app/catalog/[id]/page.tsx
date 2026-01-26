import ProductsGrid from '@/components/ProductsGrid';
import { createClient } from '@/lib/supabase-server';

// Функция для проверки формата UUID
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

interface CategoryPageProps {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const categoryId = (await params).id;

  // Проверяем, является ли ID корректным UUID
  if (!isValidUUID(categoryId)) {
    return (
      <div className="py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Некорректный идентификатор категории</h1>
          <p className="text-gray-600">ID категории: {categoryId}</p>
          <p className="text-red-600">Указанный идентификатор не является корректным UUID.</p>
        </div>
      </div>
    );
  }

  // Подключаемся к Supabase
  const supabase = await createClient();

  // Получаем данные категории
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', categoryId)
    .limit(1);

  console.log('Category lookup result:', {
    categoryId,
    data,
    error
  }); // Логирование для отладки

  if (error) {
    console.error('Supabase error:', error);
    return (
      <div className="py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Ошибка при загрузке категории</h1>
          <p className="text-gray-600">ID категории: {categoryId}</p>
          <p className="text-red-600">Ошибка: {error.message}</p>
          <p className="text-red-600">Код ошибки: {error.code}</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Категория не найдена</h1>
          <p className="text-gray-600">ID категории: {categoryId}</p>
          <p className="text-gray-600">Возможно, категория была удалена или не существует.</p>
        </div>
      </div>
    );
  }

  const category = data[0];

  // Проверяем наличие параметра поиска
  const awaitedSearchParams = await searchParams;
  const search = Array.isArray(awaitedSearchParams.search) ? awaitedSearchParams.search[0] : awaitedSearchParams.search;

  return (
    <div className="py-8 pt-24 md:pt-8"> {/* Убран bg-white, чтобы использовать фон из LayoutWrapper */}
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Категория: {category.name}</h1>
        <ProductsGrid categoryId={categoryId} search={search} />
      </div>
    </div>
  );
}