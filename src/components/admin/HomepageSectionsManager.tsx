'use client';

import { useState, useEffect } from 'react';
import { HomepageSection, HomepageSectionItem, Product } from '@/types';

export default function HomepageSectionsManager() {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [sectionItems, setSectionItems] = useState<HomepageSectionItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [title, setTitle] = useState('');
  const [position, setPosition] = useState(1);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'sections' | 'items'>('sections');
  const [loading, setLoading] = useState(true);
  
  // Для управления элементами разделов
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Получение данных из API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Загрузка разделов
        const sectionsResponse = await fetch('/api/admin/homepage-sections');
        if (!sectionsResponse.ok) {
          throw new Error('Ошибка загрузки разделов');
        }
        const sectionsData: HomepageSection[] = await sectionsResponse.json();
        setSections(sectionsData);

        // Загрузка элементов разделов
        const itemsResponse = await fetch('/api/admin/homepage-section-items');
        if (!itemsResponse.ok) {
          throw new Error('Ошибка загрузки элементов разделов');
        }
        const itemsData: HomepageSectionItem[] = await itemsResponse.json();
        setSectionItems(itemsData);

        // Загрузка всех продуктов
        const productsResponse = await fetch('/api/admin/products');
        if (!productsResponse.ok) {
          throw new Error('Ошибка загрузки продуктов');
        }
        const productsData: Product[] = await productsResponse.json();
        setProducts(productsData);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingSectionId) {
        // Обновление существующего раздела
        const response = await fetch('/api/admin/homepage-sections', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingSectionId, title, position })
        });

        if (!response.ok) {
          throw new Error('Ошибка обновления раздела');
        }

        const updatedSection = await response.json();
        setSections(sections.map(s =>
          s.id === editingSectionId ? updatedSection[0] : s
        ));
      } else {
        // Создание нового раздела
        const response = await fetch('/api/admin/homepage-sections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, position })
        });

        if (!response.ok) {
          throw new Error('Ошибка создания раздела');
        }

        const newSection = await response.json();
        setSections([...sections, newSection[0]]);
      }

      // Сброс формы
      setTitle('');
      setPosition(1);
      setEditingSectionId(null);
    } catch (error) {
      console.error('Ошибка сохранения раздела:', error);
    }
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingItemId) {
        // Обновление существующего элемента
        const response = await fetch('/api/admin/homepage-section-items', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            id: editingItemId, 
            section_id: selectedSectionId, 
            product_id: selectedProductId, 
            sort_order: sortOrder 
          })
        });

        if (!response.ok) {
          throw new Error('Ошибка обновления элемента раздела');
        }

        const updatedItem = await response.json();
        setSectionItems(sectionItems.map(i =>
          i.id === editingItemId ? updatedItem[0] : i
        ));
      } else {
        // Создание нового элемента
        const response = await fetch('/api/admin/homepage-section-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            section_id: selectedSectionId, 
            product_id: selectedProductId, 
            sort_order: sortOrder 
          })
        });

        if (!response.ok) {
          throw new Error('Ошибка создания элемента раздела');
        }

        const newItem = await response.json();
        setSectionItems([...sectionItems, newItem[0]]);
      }

      // Сброс формы
      setSelectedSectionId('');
      setSelectedProductId('');
      setSortOrder(0);
      setEditingItemId(null);
    } catch (error) {
      console.error('Ошибка сохранения элемента раздела:', error);
    }
  };

  const handleEditSection = (section: HomepageSection) => {
    setTitle(section.title);
    setPosition(section.position);
    setEditingSectionId(section.id);
    setActiveTab('sections');
  };

  const handleEditItem = (item: HomepageSectionItem) => {
    setSelectedSectionId(item.section_id);
    setSelectedProductId(item.product_id);
    setSortOrder(item.sort_order);
    setEditingItemId(item.id);
    setActiveTab('items');
  };

  const handleDeleteSection = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этот раздел?')) {
      try {
        const response = await fetch(`/api/admin/homepage-sections?id=${id}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error('Ошибка удаления раздела');
        }

        setSections(sections.filter(s => s.id !== id));
        // Также удалим связанные элементы
        setSectionItems(sectionItems.filter(i => i.section_id !== id));
      } catch (error) {
        console.error('Ошибка удаления раздела:', error);
      }
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этот элемент?')) {
      try {
        const response = await fetch(`/api/admin/homepage-section-items?id=${id}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error('Ошибка удаления элемента');
        }

        setSectionItems(sectionItems.filter(i => i.id !== id));
      } catch (error) {
        console.error('Ошибка удаления элемента:', error);
      }
    }
  };

  if (loading) {
    return <div className="p-4">Загрузка...</div>;
  }

  return (
    <div className="p-6">
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('sections')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'sections'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Разделы ГС
          </button>
          <button
            onClick={() => setActiveTab('items')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'items'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Элементы разделов
          </button>
        </nav>
      </div>

      {activeTab === 'sections' ? (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {editingSectionId ? 'Редактировать раздел' : 'Добавить новый раздел'}
          </h2>

          <form onSubmit={handleSectionSubmit} className="mb-8 p-4 bg-white rounded-lg shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                  Название раздела
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="position">
                  Позиция на странице
                </label>
                <input
                  id="position"
                  type="number"
                  value={position}
                  onChange={(e) => setPosition(Number(e.target.value))}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                {editingSectionId ? 'Обновить' : 'Создать'}
              </button>
              {editingSectionId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingSectionId(null);
                    setTitle('');
                    setPosition(1);
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
                    Название
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Позиция
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sections.map((section) => (
                  <tr key={section.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{section.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {section.position}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditSection(section)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => handleDeleteSection(section.id)}
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
      ) : (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {editingItemId ? 'Редактировать элемент' : 'Добавить новый элемент'}
          </h2>

          <form onSubmit={handleItemSubmit} className="mb-8 p-4 bg-white rounded-lg shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="sectionId">
                  Раздел ГС
                </label>
                <select
                  id="sectionId"
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="">Выберите раздел</option>
                  {sections.map(section => (
                    <option key={section.id} value={section.id}>
                      {section.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="productId">
                  Товар
                </label>
                <select
                  id="productId"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="">Выберите товар</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
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
            </div>
            <div className="flex items-center justify-between">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                {editingItemId ? 'Обновить' : 'Добавить'}
              </button>
              {editingItemId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingItemId(null);
                    setSelectedSectionId('');
                    setSelectedProductId('');
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
                    Раздел
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Товар
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
                {sectionItems.map((item) => {
                  const section = sections.find(s => s.id === item.section_id);
                  const product = products.find(p => p.id === item.product_id);
                  
                  return (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{section?.title || 'Не указан'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{product?.name || 'Не указан'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.sort_order}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditItem(item)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          Редактировать
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}