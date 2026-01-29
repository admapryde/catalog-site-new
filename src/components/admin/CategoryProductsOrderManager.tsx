'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/types';
import { useNotification } from '@/hooks/useNotification';

interface ProductWithOrder extends Product {
  sort_order: number;
}

interface CategoryProductsOrderManagerProps {
  categoryId: string;
  categoryName: string;
  initialProducts: Product[];
  onSave: () => void;
  onCancel: () => void;
}

export default function CategoryProductsOrderManager({
  categoryId,
  categoryName,
  initialProducts,
  onSave,
  onCancel
}: CategoryProductsOrderManagerProps) {
  const [products, setProducts] = useState<ProductWithOrder[]>([]);
  const [originalProducts, setOriginalProducts] = useState<ProductWithOrder[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { showNotification, renderNotification } = useNotification();

  // Инициализация продуктов с учетом их текущего порядка
  useEffect(() => {
    // Извлекаем sort_order из вложенного объекта и сортируем по нему
    const productsWithOrder: ProductWithOrder[] = initialProducts.map(product => {
      const sort_order = product.category_product_order?.sort_order ?? 0;
      return {
        ...product,
        sort_order: sort_order
      };
    }).sort((a, b) => a.sort_order - b.sort_order);

    setProducts(productsWithOrder);
    setOriginalProducts([...productsWithOrder]);
    setHasChanges(false);
  }, [initialProducts]);

  const moveProductUp = (index: number) => {
    if (index === 0) return; // Первый товар, нельзя двигать выше

    // Создаем новый массив с обновленным порядком
    const newProducts = [...products];

    // Меняем местами элементы
    [newProducts[index - 1], newProducts[index]] = [newProducts[index], newProducts[index - 1]];

    // Обновляем sort_order для всех товаров
    const updatedProducts = newProducts.map((product, idx) => ({
      ...product,
      sort_order: idx
    }));

    setProducts(updatedProducts);
    setHasChanges(true); // Устанавливаем флаг изменений
  };

  const moveProductDown = (index: number) => {
    if (index === products.length - 1) return; // Последний товар, нельзя двигать ниже

    // Создаем новый массив с обновленным порядком
    const newProducts = [...products];

    // Меняем местами элементы
    [newProducts[index + 1], newProducts[index]] = [newProducts[index], newProducts[index + 1]];

    // Обновляем sort_order для всех товаров
    const updatedProducts = newProducts.map((product, idx) => ({
      ...product,
      sort_order: idx
    }));

    setProducts(updatedProducts);
    setHasChanges(true); // Устанавливаем флаг изменений
  };

  // Функция для сохранения изменений порядка товаров
  const saveOrderChanges = async () => {
    setIsSaving(true);
    try {
      // Отправляем все изменения в одном запросе
      const response = await fetch('/api/admin/products/update-category-order', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId,
          products: products.map((product) => ({
            id: product.id,
            sort_order: product.sort_order
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка сохранения порядка товаров');
      }

      showNotification('Порядок товаров успешно сохранен!', 'success');
      setHasChanges(false); // Сбрасываем флаг изменений
      setIsSaving(false);
      onSave(); // Вызываем внешнюю функцию сохранения
    } catch (error: any) {
      console.error('Ошибка сохранения порядка товаров:', error);
      showNotification(error.message || 'Произошла ошибка при сохранении порядка товаров', 'error');
      setIsSaving(false);
      // В случае ошибки восстанавливаем исходный порядок
      setProducts([...originalProducts]);
      setHasChanges(false);
    }
  };

  // Функция для отмены изменений
  const cancelOrderChanges = () => {
    setProducts([...originalProducts]); // Восстанавливаем исходный порядок
    setHasChanges(false); // Сбрасываем флаг изменений
    onCancel(); // Вызываем внешнюю функцию отмены
  };

  return (
    <div className="mb-6">
      {renderNotification()}
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <h3 className="text-lg font-medium text-blue-800">Режим изменения порядка товаров в категории: <span className="font-bold">{categoryName}</span></h3>
        <p className="text-sm text-blue-600">Перемещайте товары стрелками, чтобы изменить порядок их отображения в каталоге</p>
      </div>
      
      {hasChanges && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-4 flex justify-between">
          <span className="text-yellow-700">Есть несохраненные изменения порядка товаров</span>
          <div className="space-x-2">
            <button
              onClick={saveOrderChanges}
              disabled={isSaving}
              className={`bg-green-600 hover:bg-green-700 text-white font-medium py-1 px-3 rounded text-sm ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
            <button
              onClick={cancelOrderChanges}
              className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-1 px-3 rounded text-sm"
            >
              Отменить
            </button>
          </div>
        </div>
      )}
      
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Название
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Цена
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Порядок
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Действия
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {products.map((product, index) => (
            <tr key={product.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{product.name}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {product.price.toLocaleString('ru-RU')} ₽
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div className="flex items-center">
                  <span className="mr-2">{index + 1}</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => moveProductUp(index)}
                      disabled={index === 0}
                      className={`p-1 rounded ${index === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-blue-600'}`}
                      title="Переместить вверх"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveProductDown(index)}
                      disabled={index === products.length - 1}
                      className={`p-1 rounded ${index === products.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-blue-600'}`}
                      title="Переместить вниз"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <span className="text-gray-500">Товар</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}