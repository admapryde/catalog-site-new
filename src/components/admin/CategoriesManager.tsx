'use client';

import { useState, useEffect } from 'react';
import { Category } from '@/types';
import FileUpload from '@/components/admin/FileUpload';
import OptimizedImage from '@/components/OptimizedImage';
import { useNotification } from '@/hooks/useNotification';

export default function CategoriesManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const { showNotification, renderNotification } = useNotification();

  // Получение категорий из API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/admin/categories');
        if (!response.ok) {
          throw new Error(`Ошибка загрузки категорий: ${response.status} ${response.statusText}`);
        }
        const data: Category[] = await response.json();
        // Сортируем категории по sort_order
        const sortedCategories = data.sort((a, b) => a.sort_order - b.sort_order);
        setCategories(sortedCategories);
      } catch (error: any) {
        console.error('Ошибка загрузки категорий:', error);
        showNotification(error.message || 'Ошибка загрузки категорий', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        // Обновление существующей категории (сохраняем текущий порядок)
        const currentCategory = categories.find(c => c.id === editingId);
        const response = await fetch('/api/admin/categories', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, name, image_url: imageUrl, sort_order: currentCategory?.sort_order })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Ошибка обновления категории');
        }

        const updatedCategory = await response.json();
        const updatedCategories = categories.map(cat =>
          cat.id === editingId ? updatedCategory[0] : cat
        ).sort((a, b) => a.sort_order - b.sort_order);
        setCategories(updatedCategories);

        showNotification('Категория успешно обновлена!', 'success');
      } else {
        // Создание новой категории
        const response = await fetch('/api/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, image_url: imageUrl, sort_order: categories.length })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Ошибка создания категории');
        }

        const newCategory = await response.json();
        // Добавляем новую категорию в конец списка с правильным порядковым номером
        const updatedCategories = [...categories, newCategory[0]].sort((a, b) => a.sort_order - b.sort_order);
        setCategories(updatedCategories);

        showNotification('Категория успешно создана!', 'success');
      }

      // Сброс формы
      setName('');
      setImageUrl('');
      setEditingId(null);
    } catch (error: any) {
      console.error('Ошибка сохранения категории:', error);
      showNotification(error.message || 'Произошла ошибка при сохранении категории', 'error');
    }
  };

  const moveCategoryUp = async (index: number) => {
    if (index === 0) return; // Первая категория, нельзя двигать выше

    // Создаем новый массив с обновленным порядком
    const newCategories = [...categories];
    const movedCategory = newCategories.splice(index, 1)[0];
    newCategories.splice(index - 1, 0, movedCategory);

    // Обновляем sort_order для всех категорий
    const reorderedCategories = newCategories.map((cat, idx) => ({
      ...cat,
      sort_order: idx
    }));

    setCategories(reorderedCategories);

    // Обновляем порядок в базе данных
    try {
      await Promise.all(
        reorderedCategories.map(category =>
          fetch('/api/admin/categories', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: category.id,
              name: category.name,
              image_url: category.image_url,
              sort_order: category.sort_order
            })
          })
        )
      );
    } catch (error) {
      console.error('Ошибка обновления порядка категорий:', error);
      // В случае ошибки восстанавливаем исходный порядок
      setCategories(categories);
    }
  };

  const moveCategoryDown = async (index: number) => {
    if (index === categories.length - 1) return; // Последняя категория, нельзя двигать ниже

    // Создаем новый массив с обновленным порядком
    const newCategories = [...categories];
    const movedCategory = newCategories.splice(index, 1)[0];
    newCategories.splice(index + 1, 0, movedCategory);

    // Обновляем sort_order для всех категорий
    const reorderedCategories = newCategories.map((cat, idx) => ({
      ...cat,
      sort_order: idx
    }));

    setCategories(reorderedCategories);

    // Обновляем порядок в базе данных
    try {
      await Promise.all(
        reorderedCategories.map(category =>
          fetch('/api/admin/categories', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: category.id,
              name: category.name,
              image_url: category.image_url,
              sort_order: category.sort_order
            })
          })
        )
      );
    } catch (error) {
      console.error('Ошибка обновления порядка категорий:', error);
      // В случае ошибки восстанавливаем исходный порядок
      setCategories(categories);
    }
  };

  const handleEdit = (category: Category) => {
    setName(category.name);
    setImageUrl(category.image_url);
    setEditingId(category.id);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить эту категорию?')) {
      try {
        const response = await fetch(`/api/admin/categories?id=${id}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Ошибка удаления категории');
        }

        // Обновляем список категорий без удаленной и пересчитываем порядок
        const filteredCategories = categories.filter(cat => cat.id !== id);
        const reorderedCategories = filteredCategories.map((cat, index) => ({
          ...cat,
          sort_order: index
        }));

        setCategories(reorderedCategories);
        showNotification('Категория успешно удалена!', 'success');
      } catch (error: any) {
        console.error('Ошибка удаления категории:', error);
        showNotification(error.message || 'Произошла ошибка при удалении категории', 'error');
      }
    }
  };

  if (loading) {
    return <div className="p-4">Загрузка...</div>;
  }

  return (
    <div className="p-6">
      {renderNotification()}
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {editingId ? 'Редактировать категорию' : 'Добавить новую категорию'}
      </h2>

      <form onSubmit={handleSubmit} className="mb-8 p-4 bg-white rounded-lg shadow-md">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
            Название
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        <div className="mb-4">
          {imageUrl && (
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Текущее изображение
              </label>
              <div className="flex items-center">
                <img
                  src={imageUrl}
                  alt="Текущее изображение категории"
                  className="h-16 w-16 object-cover rounded border"
                />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="ml-4 text-red-600 hover:text-red-800 text-sm"
                >
                  Удалить изображение
                </button>
              </div>
            </div>
          )}
          <FileUpload
            onFileUpload={(urls) => setImageUrl(urls[0] || '')}
            folder="categories"
            label="Загрузить изображение категории"
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            {editingId ? 'Обновить' : 'Создать'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setName('');
                setImageUrl('');
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Отмена
            </button>
          )}
        </div>
      </form>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Изображение
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Название
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Перемещение
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.map((category, index) => (
              <tr key={category.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <OptimizedImage
                    src={category.image_url}
                    alt={category.name}
                    width={48}
                    height={48}
                    className="h-12 w-12 object-cover rounded"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{category.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => moveCategoryUp(index)}
                      disabled={index === 0}
                      className={`p-1 rounded ${index === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-blue-600'}`}
                      title="Переместить вверх"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveCategoryDown(index)}
                      disabled={index === categories.length - 1}
                      className={`p-1 rounded ${index === categories.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-blue-600'}`}
                      title="Переместить вниз"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(category)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Редактировать
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}