'use client';

import { useState, useEffect } from 'react';
import { Category } from '@/types';
import FileUpload from '@/components/admin/FileUpload';
import OptimizedImage from '@/components/OptimizedImage';

export default function CategoriesManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Получение категорий из API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/admin/categories');
        if (!response.ok) {
          throw new Error('Ошибка загрузки категорий');
        }
        const data: Category[] = await response.json();
        setCategories(data);
      } catch (error) {
        console.error('Ошибка загрузки категорий:', error);
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
        // Обновление существующей категории
        const response = await fetch('/api/admin/categories', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, name, image_url: imageUrl, sort_order: sortOrder })
        });

        if (!response.ok) {
          throw new Error('Ошибка обновления категории');
        }

        const updatedCategory = await response.json();
        setCategories(categories.map(cat =>
          cat.id === editingId ? updatedCategory[0] : cat
        ));
      } else {
        // Создание новой категории
        const response = await fetch('/api/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, image_url: imageUrl, sort_order: sortOrder })
        });

        if (!response.ok) {
          throw new Error('Ошибка создания категории');
        }

        const newCategory = await response.json();
        setCategories([...categories, newCategory[0]]);
      }

      // Сброс формы
      setName('');
      setImageUrl('');
      setSortOrder(0);
      setEditingId(null);
    } catch (error) {
      console.error('Ошибка сохранения категории:', error);
    }
  };

  const handleEdit = (category: Category) => {
    setName(category.name);
    setImageUrl(category.image_url);
    setSortOrder(category.sort_order);
    setEditingId(category.id);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить эту категорию?')) {
      try {
        const response = await fetch(`/api/admin/categories?id=${id}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error('Ошибка удаления категории');
        }

        setCategories(categories.filter(cat => cat.id !== id));
      } catch (error) {
        console.error('Ошибка удаления категории:', error);
      }
    }
  };

  if (loading) {
    return <div className="p-4">Загрузка...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {editingId ? 'Редактировать категорию' : 'Добавить новую категорию'}
      </h2>

      <form onSubmit={handleSubmit} className="mb-8 p-4 bg-white rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
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
          <div>
            <FileUpload
              onFileUpload={(url) => setImageUrl(url)}
              folder="categories"
              label="Загрузить изображение категории"
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="sortOrder">
            Порядок сортировки
          </label>
          <input
            id="sortOrder"
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
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
                setSortOrder(0);
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
                Порядок
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.map((category) => (
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
                  {category.sort_order}
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