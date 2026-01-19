'use client';

import { useState, useEffect } from 'react';

interface SpecType {
  id: string;
  name: string;
  filter_type: 'SELECT' | 'CHECKBOXES' | 'RADIO' | 'RANGE';
  data_type: 'TEXT' | 'NUMBER' | 'BOOLEAN';
  category_id: string | null;
  category_name: string;
  created_at: string;
  updated_at: string;
}

export default function SpecTypesManager() {
  const [specTypes, setSpecTypes] = useState<SpecType[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [name, setName] = useState('');
  const [filterType, setFilterType] = useState<'SELECT' | 'CHECKBOXES' | 'RADIO' | 'RANGE'>('SELECT');
  const [dataType, setDataType] = useState<'TEXT' | 'NUMBER' | 'BOOLEAN'>('TEXT');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Функция для получения русского названия типа фильтра
  const getRussianFilterTypeName = (filterType: string) => {
    switch(filterType) {
      case 'RANGE':
        return 'Диапазон';
      case 'CHECKBOXES':
        return 'Чек-бокс';
      case 'RADIO':
        return 'Радио';
      case 'SELECT':
        return 'Выпадающий список';
      default:
        return filterType;
    }
  };

  // Функция для получения русского названия типа данных
  const getRussianDataTypeName = (dataType: string) => {
    switch(dataType) {
      case 'TEXT':
        return 'Текст';
      case 'NUMBER':
        return 'Число';
      case 'BOOLEAN':
        return 'Булевый';
      default:
        return dataType;
    }
  };

  // Загрузка типов характеристик и категорий
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Загрузка типов характеристик
        const specTypesResponse = await fetch('/api/spec-types');
        if (!specTypesResponse.ok) {
          throw new Error('Ошибка загрузки типов характеристик');
        }
        const specTypesData = await specTypesResponse.json();
        setSpecTypes(specTypesData);

        // Загрузка категорий
        const categoriesResponse = await fetch('/api/admin/categories');
        if (!categoriesResponse.ok) {
          throw new Error('Ошибка загрузки категорий');
        }
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData.map((cat: any) => ({ id: cat.id, name: cat.name })));
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const specTypeData = {
        name,
        filter_type: filterType,
        data_type: dataType,
        category_id: categoryId || null
      };

      if (editingId) {
        // Обновление существующего типа характеристики
        const response = await fetch('/api/spec-types', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingId,
            ...specTypeData
          })
        });

        if (!response.ok) {
          throw new Error('Ошибка обновления типа характеристики');
        }

        const updatedSpecType = await response.json();
        setSpecTypes(specTypes.map(st => 
          st.id === editingId ? updatedSpecType : st
        ));
      } else {
        // Создание нового типа характеристики
        const response = await fetch('/api/spec-types', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(specTypeData)
        });

        if (!response.ok) {
          throw new Error('Ошибка создания типа характеристики');
        }

        const newSpecType = await response.json();
        setSpecTypes([...specTypes, newSpecType]);
      }

      // Сброс формы
      resetForm();
    } catch (error) {
      console.error('Ошибка сохранения типа характеристики:', error);
    }
  };

  const resetForm = () => {
    setName('');
    setFilterType('SELECT');
    setDataType('TEXT');
    setCategoryId(null);
    setEditingId(null);
  };

  const handleEdit = (specType: SpecType) => {
    setName(specType.name);
    setFilterType(specType.filter_type);
    setDataType(specType.data_type);
    setCategoryId(specType.category_id);
    setEditingId(specType.id);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этот тип характеристики? Это может повлиять на существующие характеристики продуктов.')) {
      try {
        const response = await fetch(`/api/spec-types?id=${id}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error('Ошибка удаления типа характеристики');
        }

        setSpecTypes(specTypes.filter(st => st.id !== id));
      } catch (error) {
        console.error('Ошибка удаления типа характеристики:', error);
      }
    }
  };

  if (loading) {
    return <div className="p-4">Загрузка...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {editingId ? 'Редактировать тип характеристики' : 'Добавить новый тип характеристики'}
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
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="categoryId">
              Категория (необязательно)
            </label>
            <select
              id="categoryId"
              value={categoryId || ''}
              onChange={(e) => setCategoryId(e.target.value || null)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="">Общие (для всех категорий)</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="filterType">
              Тип фильтра
            </label>
            <select
              id="filterType"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              <option value="SELECT">Выпадающий список</option>
              <option value="CHECKBOXES">Чек-боксы</option>
              <option value="RADIO">Радио-кнопки</option>
              <option value="RANGE">Диапазон</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="dataType">
              Тип данных
            </label>
            <select
              id="dataType"
              value={dataType}
              onChange={(e) => setDataType(e.target.value as any)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              <option value="TEXT">Текст</option>
              <option value="NUMBER">Число</option>
              <option value="BOOLEAN">Булевый</option>
            </select>
          </div>
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
              onClick={resetForm}
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
                Название
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Тип фильтра
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Тип данных
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Категория
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {specTypes.map((specType) => (
              <tr key={specType.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{specType.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{getRussianFilterTypeName(specType.filter_type)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{getRussianDataTypeName(specType.data_type)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{specType.category_name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(specType)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Редактировать
                  </button>
                  <button
                    onClick={() => handleDelete(specType.id)}
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