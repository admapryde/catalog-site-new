'use client';

import { useState, useEffect } from 'react';
import { Product, ProductImage, ProductSpec, SpecType, Template, TemplateWithSpecs } from '@/types';
import FileUpload from '@/components/admin/FileUpload';
import HomepageSectionSelector from '@/components/admin/HomepageSectionSelector';
import OptimizedImage from '@/components/OptimizedImage';
import { useNotification } from '@/hooks/useNotification';
import TableImportModal from '@/components/admin/TableImportModal';
import BulkDeleteModal from '@/components/admin/BulkDeleteModal';
import CategoryProductsOrderManager from '@/components/admin/CategoryProductsOrderManager';

// Расширенный интерфейс продукта с полями, которые возвращаются из API
interface ProductWithDates extends Product {
  created_at: string;
  updated_at: string;
}

export default function ProductsManager() {
  const [products, setProducts] = useState<ProductWithDates[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [templates, setTemplates] = useState<TemplateWithSpecs[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState(0);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<ProductImage[]>([]);
  const [specs, setSpecs] = useState<{ property_name: string; value: string; spec_type_id?: string }[]>([]);
  const [originalImages, setOriginalImages] = useState<ProductImage[]>([]);
  const [originalSpecs, setOriginalSpecs] = useState<{ property_name: string; value: string; spec_type_id?: string }[]>([]);
  const [newSpec, setNewSpec] = useState({ property_name: '', value: '', spec_type_id: '' });
  const [specTypes, setSpecTypes] = useState<SpecType[]>([]);
  const [filteredSpecTypes, setFilteredSpecTypes] = useState<SpecType[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'categories' | 'products'>('products');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [sortConfig, setSortConfig] = useState<Record<string, { key: 'name' | 'price' | 'created_at'; direction: 'asc' | 'desc' }>>({});
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [orderModeCategory, setOrderModeCategory] = useState<string | null>(null);

  const { showNotification, renderNotification } = useNotification();

  // Функция для получения русского названия типа характеристики
  const getRussianSpecTypeName = (name: string, filterType: string) => {
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
        return name;
    }
  };

  // Функция для переключения выделения товара
  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  // Функция для выделения всех товаров в категории
  const toggleCategorySelection = (categoryProducts: Product[]) => {
    const categoryProductIds = categoryProducts.map(p => p.id);
    const allSelected = categoryProductIds.every(id => selectedProducts.includes(id));

    if (allSelected) {
      // Снять выделение со всех товаров в категории
      setSelectedProducts(prev => prev.filter(id => !categoryProductIds.includes(id)));
    } else {
      // Выделить все товары в категории
      setSelectedProducts(prev => {
        const newSelection = [...prev];
        categoryProductIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    }
  };

  // Функция для массового удаления
  const handleBulkDelete = async () => {
    setIsBulkDeleting(true); // Устанавливаем состояние загрузки

    try {
      // Сначала удаляем товары из локального состояния для немедленного обновления UI
      setProducts(products.filter(prod => !selectedProducts.includes(prod.id)));

      // Затем удаляем все выделенные товары с сервера за один запрос
      const response = await fetch('/api/admin/products/bulk-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Включаем куки для аутентификации
        body: JSON.stringify({ productIds: selectedProducts })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Ошибка массового удаления товаров`);
      }

      const result = await response.json();
      showNotification(`Успешно удалено ${result.deletedCount} товаров`, 'success');

      // Обновляем список товаров для синхронизации с сервером (с обходом кэша)
      updateProductsList(true);

      // Сбрасываем выделение
      setSelectedProducts([]);

      // Закрываем модальное окно
      setIsBulkDeleteModalOpen(false);
    } catch (error: any) {
      console.error('Ошибка при массовом удалении:', error);
      showNotification(error.message || 'Произошла ошибка при массовом удалении', 'error');

      // В случае ошибки восстановим товары в списке
      updateProductsList();
    } finally {
      setIsBulkDeleting(false); // Сбрасываем состояние загрузки
    }
  };

  // Функция для обновления списка товаров
  const updateProductsList = async (bypassCache: boolean = false) => {
    try {
      // Загрузка товаров
      const url = bypassCache
        ? `/api/admin/products?t=${Date.now()}`
        : '/api/admin/products';

      const productsResponse = await fetch(url, {
        credentials: 'include' // Включаем куки для аутентификации
      });
      if (!productsResponse.ok) {
        throw new Error(`Ошибка загрузки товаров: ${productsResponse.status} ${productsResponse.statusText}`);
      }
      const productsData = await productsResponse.json();
      setProducts(productsData);
    } catch (error: any) {
      console.error('Ошибка загрузки данных:', error);
      showNotification(error.message || 'Ошибка загрузки товаров', 'error');
    }
  };

  // Получение товаров, категорий и шаблонов из API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Загрузка товаров
        const productsResponse = await fetch('/api/admin/products');
        if (!productsResponse.ok) {
          throw new Error(`Ошибка загрузки товаров: ${productsResponse.status} ${productsResponse.statusText}`);
        }
        const productsData = await productsResponse.json();
        setProducts(productsData);

        // Загрузка типов характеристик
        const specTypesResponse = await fetch('/api/spec-types');
        if (!specTypesResponse.ok) {
          throw new Error(`Ошибка загрузки типов характеристик: ${specTypesResponse.status} ${specTypesResponse.statusText}`);
        }
        const specTypesData = await specTypesResponse.json();
        setSpecTypes(specTypesData);

        // Загрузка категорий
        const categoriesResponse = await fetch('/api/admin/categories');
        if (!categoriesResponse.ok) {
          throw new Error(`Ошибка загрузки категорий: ${categoriesResponse.status} ${categoriesResponse.statusText}`);
        }
        const categoriesData = await categoriesResponse.json();
        const categoriesList = categoriesData.map((cat: any) => ({ id: cat.id, name: cat.name }));
        setCategories(categoriesList);

        // Устанавливаем начальное состояние для expandedCategories - все категории скрыты
        const initialExpandedState: Record<string, boolean> = {};
        // Устанавливаем начальное состояние для сортировки - по умолчанию сортируем по дате создания (новые первыми)
        const initialSortState: Record<string, { key: 'name' | 'price' | 'created_at'; direction: 'asc' | 'desc' }> = {};

        categoriesList.forEach((category: { id: string; name: string }) => {
          initialExpandedState[category.id] = false; // Все категории скрыты по умолчанию
          initialSortState[category.id] = { key: 'created_at', direction: 'desc' }; // Сортировка по дате создания (новые первыми)
        });

        setExpandedCategories(prev => ({
          ...prev,
          ...initialExpandedState
        }));

        setSortConfig(prev => ({
          ...prev,
          ...initialSortState
        }));

        // Загрузка шаблонов
        const templatesResponse = await fetch('/api/admin/templates');
        if (!templatesResponse.ok) {
          throw new Error(`Ошибка загрузки шаблонов: ${templatesResponse.status} ${templatesResponse.statusText}`);
        }
        const templatesData = await templatesResponse.json();
        setTemplates(templatesData);
      } catch (error: any) {
        console.error('Ошибка загрузки данных:', error);
        showNotification(error.message || 'Ошибка загрузки данных', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Обновляем список товаров при изменении
  const refreshProducts = () => {
    updateProductsList();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        // Обновление существующего товара
        const response = await fetch('/api/admin/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingId,
            category_id: categoryId,
            name,
            price,
            description,
            images,  // Всё равно отправляем, но в API маршруте теперь проверим, нужно ли обновлять
            specs    // Всё равно отправляем, но в API маршруте теперь проверим, нужно ли обновлять
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Ошибка обновления товара');
        }

        const updatedProduct = await response.json();
        setProducts(products.map(prod =>
          prod.id === editingId ? updatedProduct : prod
        ));

        showNotification('Товар успешно обновлен!', 'success');
      } else {
        // Создание нового товара
        const response = await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category_id: categoryId,
            name,
            price,
            description,
            images,
            specs
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Ошибка создания товара');
        }

        const newProduct = await response.json();
        setProducts([...products, newProduct]);

        // Переключаем форму в режим редактирования созданного товара
        // чтобы пользователь мог сразу добавить его в разделы ГС
        setName(newProduct.name);
        setCategoryId(newProduct.category_id);
        setPrice(newProduct.price);
        setDescription(newProduct.description || '');
        const productImages = newProduct.images || [];
        const productSpecs = newProduct.specs || [];
        setImages(productImages);
        setSpecs(productSpecs);
        setOriginalImages([...productImages]);
        setOriginalSpecs([...productSpecs]);
        setEditingId(newProduct.id);

        showNotification('Товар успешно создан!', 'success');
      }

      // Не сбрасываем форму при создании - вместо этого переходим в режим редактирования
      // чтобы пользователь мог сразу добавить товар в разделы ГС
      // setName('');
      // setCategoryId('');
      // setPrice(0);
      // setImages([]);
      // setSpecs([]);
      // setEditingId(null);
    } catch (error: any) {
      console.error('Ошибка сохранения товара:', error);
      showNotification(error.message || 'Произошла ошибка при сохранении товара', 'error');
    }

    // Обновляем список товаров (с обходом кэша)
    updateProductsList(true);
  };

  // Обновление списка типов характеристик при изменении категории
  useEffect(() => {
    if (categoryId) {
      // Фильтруем типы характеристик по выбранной категории
      const filtered = specTypes.filter(st => st.category_id === categoryId || st.category_id === null);
      setFilteredSpecTypes(filtered);
    } else {
      setFilteredSpecTypes(specTypes.filter(st => st.category_id === null));
    }
  }, [categoryId, specTypes]);

  // Обновляем состояние expandedCategories и sortConfig при изменении списка категорий
  useEffect(() => {
    setExpandedCategories(prev => {
      const newExpandedState = { ...prev };

      // Добавляем новые категории
      categories.forEach(category => {
        if (!(category.id in newExpandedState)) {
          newExpandedState[category.id] = false; // Новые категории скрываются по умолчанию
        }
      });

      // Удаляем старые категории
      Object.keys(newExpandedState).forEach(categoryId => {
        if (!categories.some(cat => cat.id === categoryId)) {
          delete newExpandedState[categoryId];
        }
      });

      return newExpandedState;
    });

    setSortConfig(prev => {
      const newSortState = { ...prev };

      // Добавляем начальную сортировку для новых категорий
      categories.forEach(category => {
        if (!(category.id in newSortState)) {
          newSortState[category.id] = { key: 'created_at', direction: 'desc' }; // Новые категории сортируются по дате создания (новые первыми)
        }
      });

      // Удаляем сортировку для удаленных категорий
      Object.keys(newSortState).forEach(categoryId => {
        if (!categories.some(cat => cat.id === categoryId)) {
          delete newSortState[categoryId];
        }
      });

      return newSortState;
    });
  }, [categories]);

  const handleEdit = (product: Product) => {
    setName(product.name);
    setCategoryId(product.category_id);
    setPrice(product.price);
    setDescription(product.description || '');
    const productImages = product.images || [];
    const productSpecs = product.specs || [];
    setImages(productImages);
    setSpecs(productSpecs);
    setOriginalImages([...productImages]); // Сохраняем копию оригинальных изображений
    setOriginalSpecs([...productSpecs]);   // Сохраняем копию оригинальных характеристик
    setEditingId(product.id);
    setActiveTab('products'); // Переключаемся на вкладку продуктов при редактировании

    // Открываем категорию, к которой принадлежит товар
    setExpandedCategories(prev => ({
      ...prev,
      [product.category_id]: true
    }));

    // Убедимся, что у категории есть конфигурация сортировки
    setSortConfig(prev => {
      if (!(product.category_id in prev)) {
        return {
          ...prev,
          [product.category_id]: { key: 'created_at', direction: 'desc' }
        };
      }
      return prev;
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этот товар?')) {
      try {
        // Сначала удалим товар из локального состояния для немедленного обновления UI
        setProducts(products.filter(prod => prod.id !== id));

        const response = await fetch(`/api/admin/products?id=${id}`, {
          method: 'DELETE',
          credentials: 'include' // Включаем куки для аутентификации
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Ошибка удаления товара');
        }

        showNotification('Товар успешно удален!', 'success');

        // Обновляем список товаров для синхронизации с сервером (с обходом кэша)
        updateProductsList(true);
      } catch (error: any) {
        console.error('Ошибка удаления товара:', error);
        showNotification(error.message || 'Произошла ошибка при удаления товара', 'error');

        // В случае ошибки восстановим товар в списке
        updateProductsList();
      }
    }
  };

  const addSpec = () => {
    if (newSpec.property_name && newSpec.value) {
      setSpecs([...specs, { ...newSpec }]);
      setNewSpec({ property_name: '', value: '', spec_type_id: '' });
    }
  };

  const removeSpec = (index: number) => {
    setSpecs(specs.filter((_, i) => i !== index));
  };

  const updateSpecProperty = (index: number, property: 'property_name' | 'value' | 'spec_type_id', value: string) => {
    const newSpecs = [...specs];
    newSpecs[index] = { ...newSpecs[index], [property]: value };
    setSpecs(newSpecs);
  };

  const moveSpecUp = (index: number) => {
    if (index > 0) {
      const newSpecs = [...specs];
      [newSpecs[index - 1], newSpecs[index]] = [newSpecs[index], newSpecs[index - 1]];
      setSpecs(newSpecs);
    }
  };

  const moveSpecDown = (index: number) => {
    if (index < specs.length - 1) {
      const newSpecs = [...specs];
      [newSpecs[index], newSpecs[index + 1]] = [newSpecs[index + 1], newSpecs[index]];
      setSpecs(newSpecs);
    }
  };

  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      // Добавляем характеристики из шаблона к существующим
      const newSpecs = [...specs];
      template.specs.forEach(spec => {
        // Проверяем, что такой характеристики еще нет
        const exists = newSpecs.some(s => s.property_name === spec.property_name && s.value === spec.value);
        if (!exists) {
          newSpecs.push({
            property_name: spec.property_name,
            value: spec.value,
            spec_type_id: spec.spec_type_id || undefined
          });
        }
      });
      setSpecs(newSpecs);
      setSelectedTemplate(''); // Сбрасываем выбор шаблона
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleSort = (categoryId: string, key: 'name' | 'price' | 'created_at') => {
    setSortConfig(prev => {
      const currentSort = prev[categoryId];
      let direction: 'asc' | 'desc' = 'asc';

      // Если уже сортируем по этому полю, меняем направление
      if (currentSort && currentSort.key === key) {
        direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
      }

      return {
        ...prev,
        [categoryId]: { key, direction }
      };
    });
  };

  const getSortIcon = (categoryId: string, key: 'name' | 'price' | 'created_at') => {
    const currentSort = sortConfig[categoryId];
    if (!currentSort || currentSort.key !== key) {
      return (
        <span className="ml-1 text-gray-400">
          <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
          </svg>
        </span>
      );
    }

    return currentSort.direction === 'asc' ? (
      <span className="ml-1 text-blue-600">
        <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path>
        </svg>
      </span>
    ) : (
      <span className="ml-1 text-blue-600">
        <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </span>
    );
  };

  if (loading) {
    return <div className="p-4">Загрузка...</div>;
  }

  return (
    <div className="p-6">
      {renderNotification()}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('products')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'products'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Товары
          </button>
        </nav>
      </div>

      {activeTab === 'products' ? (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {editingId ? 'Редактировать товар' : 'Добавить новый товар'}
            </h2>
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Загрузить из таблицы
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mb-8 p-4 bg-white rounded-lg shadow-md">
            <div className="grid grid-cols-1 gap-4 mb-4">
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
                  Категория
                </label>
                <select
                  id="categoryId"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="">Выберите категорию</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="price">
                Цена
              </label>
              <input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                Описание
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                rows={4}
                placeholder="Введите описание товара"
              />
            </div>

            {/* Управление изображениями */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-800 mb-3">Изображения товара</h3>
              <FileUpload
                onFileUpload={(urls) => {
                  urls.forEach(url => {
                    const newImage: ProductImage = {
                      id: Date.now().toString(),
                      product_id: editingId || 'new',
                      image_url: url,
                      is_main: images.length === 0 // Первое изображение автоматически становится главным
                    };
                    setImages(prev => [...prev, newImage]);
                  });
                }}
                folder="products"
                label="Загрузить изображение товара"
              />

              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div key={image.id} className="relative">
                      <OptimizedImage
                        src={image.image_url}
                        alt={`Изображение ${index + 1}`}
                        width={100}
                        height={100}
                        className="h-24 w-full object-cover rounded"
                      />
                      <div className="flex items-center mt-1">
                        <input
                          type="radio"
                          name="mainImage"
                          checked={image.is_main}
                          onChange={() => {
                            // Сделать это изображение главным, остальные - нет
                            setImages(images.map(img => ({
                              ...img,
                              is_main: img.id === image.id
                            })));
                          }}
                          className="mr-2"
                        />
                        <span className="text-xs text-gray-700">Главное</span>
                        <button
                          type="button"
                          onClick={() => setImages(images.filter(img => img.id !== image.id))}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Управление характеристиками */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-800 mb-3">Характеристики товара</h3>

              {/* Выбор шаблона */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="templateSelect">
                  Применить шаблон
                </label>
                <div className="flex">
                  <select
                    id="templateSelect"
                    value={selectedTemplate}
                    onChange={(e) => {
                      setSelectedTemplate(e.target.value);
                      if (e.target.value) {
                        applyTemplate(e.target.value);
                      }
                    }}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mr-2"
                  >
                    <option value="">Выберите шаблон</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="propertyName">
                    Название характеристики
                  </label>
                  <input
                    id="propertyName"
                    type="text"
                    value={newSpec.property_name}
                    onChange={(e) => setNewSpec({...newSpec, property_name: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="Например: Материал"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="propertyValue">
                    Значение
                  </label>
                  <input
                    id="propertyValue"
                    type="text"
                    value={newSpec.value}
                    onChange={(e) => setNewSpec({...newSpec, value: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="Например: Дерево"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="specTypeId">
                  Тип характеристики
                </label>
                <select
                  id="specTypeId"
                  value={newSpec.spec_type_id || ''}
                  onChange={(e) => setNewSpec({...newSpec, spec_type_id: e.target.value})}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="">Выберите тип характеристики</option>
                  {filteredSpecTypes.map((specType) => (
                    <option key={specType.id} value={specType.id}>
                      {getRussianSpecTypeName(specType.name, specType.filter_type)} ({specType.filter_type})
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={addSpec}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Добавить характеристику
              </button>

              {specs.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-md font-medium text-gray-700 mb-2">Добавленные характеристики:</h4>
                  <ul className="divide-y divide-gray-200">
                    {specs.map((spec, index) => (
                      <li
                        key={`spec-${index}`}
                        className="py-2 flex justify-between items-center"
                      >
                        <div className="flex items-center flex-grow">
                          <div className="flex flex-col mr-2">
                            <button
                              type="button"
                              onClick={() => moveSpecUp(index)}
                              disabled={index === 0}
                              className={`p-1 rounded ${index === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200'}`}
                              title="Переместить вверх"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => moveSpecDown(index)}
                              disabled={index === specs.length - 1}
                              className={`p-1 rounded ${index === specs.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200'}`}
                              title="Переместить вниз"
                            >
                              ↓
                            </button>
                          </div>
                          <input
                            type="text"
                            value={spec.property_name}
                            onChange={(e) => updateSpecProperty(index, 'property_name', e.target.value)}
                            className="shadow appearance-none border rounded py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mr-2 flex-grow"
                            placeholder="Название"
                          />
                          <span className="mx-2">:</span>
                          <input
                            type="text"
                            value={spec.value}
                            onChange={(e) => updateSpecProperty(index, 'value', e.target.value)}
                            className="shadow appearance-none border rounded py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline flex-grow"
                            placeholder="Значение"
                          />
                          <select
                            value={spec.spec_type_id || ''}
                            onChange={(e) => updateSpecProperty(index, 'spec_type_id', e.target.value)}
                            className="shadow appearance-none border rounded py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ml-2"
                          >
                            <option value="">Тип...</option>
                            {filteredSpecTypes.map((specType) => (
                              <option key={specType.id} value={specType.id}>
                                {getRussianSpecTypeName(specType.name, specType.filter_type)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSpec(index)}
                          className="text-red-600 hover:text-red-900 ml-4"
                        >
                          Удалить
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Компонент для добавления в разделы ГС */}
            {editingId && (
              <div className="mb-6">
                <HomepageSectionSelector
                  productId={editingId}
                  initialSections={[]}
                  onUpdate={refreshProducts}
                />
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-4">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full sm:w-auto"
              >
                {editingId ? 'Обновить' : 'Создать'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setName('');
                    setCategoryId('');
                    setPrice(0);
                    setDescription('');
                    setImages([]);
                    setSpecs([]);
                    setOriginalImages([]);
                    setOriginalSpecs([]);
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full sm:w-auto"
                >
                  Отмена
                </button>
              )}
            </div>
          </form>

          {/* Отображение отдельной таблицы для каждой категории товаров */}
          {categories.map((category) => {
            const categoryProducts = products.filter(product => product.category_id === category.id);

            // Пропускаем категории без товаров, если не хотим показывать пустые таблицы
            if (categoryProducts.length === 0) return null;

            const isExpanded = expandedCategories[category.id] || false;
            const isOrderMode = orderModeCategory === category.id;

            const toggleOrderMode = () => {
              setOrderModeCategory(isOrderMode ? null : category.id);
            };

            const handleSaveOrder = () => {
              setOrderModeCategory(null);
              // Обновляем список товаров
              updateProductsList();
            };

            const handleCancelOrder = () => {
              setOrderModeCategory(null);
            };

            return (
              <div key={category.id} className="mb-8">
                <div className="flex items-center justify-between">
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={() => toggleCategory(category.id)}
                  >
                    <h3 className="text-xl font-semibold text-gray-800">{category.name} ({categoryProducts.length})</h3>
                    <svg
                      className={`w-4 h-4 ml-2 transition-transform duration-200 ${isExpanded ? '' : 'rotate-90'}`}
                      fill="#4b5563"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>

                  {isExpanded && (
                    <div className="flex space-x-2">
                      {isOrderMode ? (
                        <button
                          onClick={handleCancelOrder}
                          className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-1 px-3 rounded text-sm"
                        >
                          Отмена
                        </button>
                      ) : (
                        <button
                          onClick={toggleOrderMode}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded text-sm"
                        >
                          Изменить порядок
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {isExpanded && !isOrderMode && (
                  <div className="mt-4 bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="flex justify-between items-center mb-2 px-4 py-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={categoryProducts.length > 0 && categoryProducts.every(p => selectedProducts.includes(p.id))}
                          onChange={() => toggleCategorySelection(categoryProducts)}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {selectedProducts.filter(id => categoryProducts.some(p => p.id === id)).length} из {categoryProducts.length} выбрано
                        </span>
                      </div>
                      {selectedProducts.filter(id => categoryProducts.some(p => p.id === id)).length > 0 && (
                        <button
                          onClick={() => setIsBulkDeleteModalOpen(true)}
                          className="bg-red-600 hover:bg-red-700 text-white font-medium py-1 px-3 rounded text-sm"
                        >
                          Удалить выделенные
                        </button>
                      )}
                    </div>
                    {/* Адаптивная таблица для мобильных устройств */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 hidden md:table-header-group">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                              <input
                                type="checkbox"
                                checked={categoryProducts.length > 0 && categoryProducts.every(p => selectedProducts.includes(p.id))}
                                onChange={() => toggleCategorySelection(categoryProducts)}
                                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                              />
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              <button
                                onClick={() => handleSort(category.id, 'name')}
                                className="flex items-center focus:outline-none"
                              >
                                Название
                                {getSortIcon(category.id, 'name')}
                              </button>
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              <button
                                onClick={() => handleSort(category.id, 'price')}
                                className="flex items-center focus:outline-none"
                              >
                                Цена
                                {getSortIcon(category.id, 'price')}
                              </button>
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              <button
                                onClick={() => handleSort(category.id, 'created_at')}
                                className="flex items-center focus:outline-none"
                              >
                                Дата создания
                                {getSortIcon(category.id, 'created_at')}
                              </button>
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Действия
                            </th>
                          </tr>
                        </thead>
                      <tbody className="bg-white divide-y divide-gray-200 md:table-row-group">
                        {(() => {
                          // Сортируем товары в зависимости от конфигурации сортировки для этой категории
                          const sortedProducts = [...categoryProducts];
                          const categorySortConfig = sortConfig[category.id];

                          if (categorySortConfig) {
                            sortedProducts.sort((a, b) => {
                              let aValue, bValue;

                              switch (categorySortConfig.key) {
                                case 'name':
                                  aValue = a.name.toLowerCase();
                                  bValue = b.name.toLowerCase();
                                  break;
                                case 'price':
                                  aValue = a.price;
                                  bValue = b.price;
                                  break;
                                case 'created_at':
                                  aValue = new Date(a.created_at).getTime();
                                  bValue = new Date(b.created_at).getTime();
                                  break;
                                default:
                                  aValue = 0;
                                  bValue = 0;
                              }

                              // Сравниваем значения в зависимости от направления сортировки
                              if (categorySortConfig.direction === 'asc') {
                                return aValue > bValue ? 1 : -1;
                              } else {
                                return aValue < bValue ? 1 : -1;
                              }
                            });
                          }

                          return sortedProducts.map((product) => (
                            <tr
                              key={product.id}
                              className={`md:table-row ${selectedProducts.includes(product.id) ? 'bg-blue-50' : ''}`}
                            >
                              <td className="px-6 py-4 whitespace-nowrap md:table-cell">
                                <input
                                  type="checkbox"
                                  checked={selectedProducts.includes(product.id)}
                                  onChange={() => toggleProductSelection(product.id)}
                                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap md:table-cell">
                                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 md:table-cell">
                                {product.price.toLocaleString('ru-RU')} ₽
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 md:table-cell">
                                {new Date(product.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium md:table-cell">
                                <button
                                  onClick={() => handleEdit(product)}
                                  className="text-indigo-600 hover:text-indigo-900 mr-4"
                                >
                                  Редактировать
                                </button>
                                <button
                                  onClick={() => handleDelete(product.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Удалить
                                </button>
                              </td>
                              
                              {/* Адаптивная версия для мобильных устройств - скрыта на десктопе */}
                              <td className="px-6 py-4 sm:hidden table-cell">
                                <div className="flex justify-end space-x-2">
                                  <button
                                    onClick={() => handleEdit(product)}
                                    className="text-indigo-600 hover:text-indigo-900"
                                  >
                                    Редактировать
                                  </button>
                                  <button
                                    onClick={() => handleDelete(product.id)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Удалить
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>

                  {/* Адаптивная карточка для мобильных устройств - отдельная таблица */}
                  <div className="overflow-x-auto md:hidden mt-6">
                    <table className="min-w-full divide-y divide-gray-200">
                      <tbody className="bg-white divide-y divide-gray-200">
                        {(() => {
                          // Сортируем товары в зависимости от конфигурации сортировки для этой категории
                          const sortedProducts = [...categoryProducts];
                          const categorySortConfig = sortConfig[category.id];

                          if (categorySortConfig) {
                            sortedProducts.sort((a, b) => {
                              let aValue, bValue;

                              switch (categorySortConfig.key) {
                                case 'name':
                                  aValue = a.name.toLowerCase();
                                  bValue = b.name.toLowerCase();
                                  break;
                                case 'price':
                                  aValue = a.price;
                                  bValue = b.price;
                                  break;
                                case 'created_at':
                                  aValue = new Date(a.created_at).getTime();
                                  bValue = new Date(b.created_at).getTime();
                                  break;
                                default:
                                  aValue = 0;
                                  bValue = 0;
                              }

                              // Сравниваем значения в зависимости от направления сортировки
                              if (categorySortConfig.direction === 'asc') {
                                return aValue > bValue ? 1 : -1;
                              } else {
                                return aValue < bValue ? 1 : -1;
                              }
                            });
                          }

                          return sortedProducts.map((product) => (
                            <tr key={`${product.id}-mobile`} className="block">
                              <td className="block p-4 border-b">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start">
                                    <input
                                      type="checkbox"
                                      checked={selectedProducts.includes(product.id)}
                                      onChange={() => toggleProductSelection(product.id)}
                                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mt-1 mr-3"
                                    />
                                    <div>
                                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                      <div className="text-sm text-gray-500">{product.price.toLocaleString('ru-RU')} ₽</div>
                                      <div className="text-xs text-gray-400">{new Date(product.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                    </div>
                                  </div>

                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleEdit(product)}
                                      className="text-indigo-600 hover:text-indigo-900"
                                    >
                                      Редактировать
                                    </button>
                                    <button
                                      onClick={() => handleDelete(product.id)}
                                      className="text-red-600 hover:text-red-900"
                                    >
                                      Удалить
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                  </div>
                )}

                {isExpanded && isOrderMode && (
                  <div className="mt-4">
                    <CategoryProductsOrderManager
                      categoryId={category.id}
                      categoryName={category.name}
                      initialProducts={categoryProducts}
                      onSave={handleSaveOrder}
                      onCancel={handleCancelOrder}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : null}

      <TableImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={updateProductsList}
      />

      <BulkDeleteModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onDelete={handleBulkDelete}
        selectedProducts={products.filter(p => selectedProducts.includes(p.id))}
        isLoading={isBulkDeleting}
      />
    </div>
  );
}