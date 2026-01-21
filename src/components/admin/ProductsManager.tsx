'use client';

import { useState, useEffect } from 'react';
import { Product, ProductImage, ProductSpec, SpecType } from '@/types';
import FileUpload from '@/components/admin/FileUpload';
import HomepageSectionSelector from '@/components/admin/HomepageSectionSelector';
import OptimizedImage from '@/components/OptimizedImage';

export default function ProductsManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
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

  // Функция для обновления списка товаров
  const updateProductsList = async () => {
    try {
      // Загрузка товаров
      const productsResponse = await fetch('/api/admin/products');
      if (!productsResponse.ok) {
        throw new Error('Ошибка загрузки товаров');
      }
      const productsData = await productsResponse.json();
      setProducts(productsData);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    }
  };

  // Получение товаров и категорий из API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Загрузка товаров
        const productsResponse = await fetch('/api/admin/products');
        if (!productsResponse.ok) {
          throw new Error('Ошибка загрузки товаров');
        }
        const productsData = await productsResponse.json();
        setProducts(productsData);

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
          throw new Error('Ошибка обновления товара');
        }

        const updatedProduct = await response.json();
        setProducts(products.map(prod =>
          prod.id === editingId ? updatedProduct : prod
        ));
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
          throw new Error('Ошибка создания товара');
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
      }

      // Не сбрасываем форму при создании - вместо этого переходим в режим редактирования
      // чтобы пользователь мог сразу добавить товар в разделы ГС
      // setName('');
      // setCategoryId('');
      // setPrice(0);
      // setImages([]);
      // setSpecs([]);
      // setEditingId(null);
    } catch (error) {
      console.error('Ошибка сохранения товара:', error);
    }
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
  };

  const handleDelete = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этот товар?')) {
      try {
        const response = await fetch(`/api/admin/products?id=${id}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error('Ошибка удаления товара');
        }

        setProducts(products.filter(prod => prod.id !== id));
      } catch (error) {
        console.error('Ошибка удаления товара:', error);
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

  if (loading) {
    return <div className="p-4">Загрузка...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {editingId ? 'Редактировать товар' : 'Добавить новый товар'}
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
            onFileUpload={(url) => {
              const newImage: ProductImage = {
                id: Date.now().toString(),
                product_id: editingId || 'new',
                image_url: url,
                is_main: images.length === 0 // Первое изображение автоматически становится главным
              };
              setImages([...images, newImage]);
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

        <div className="flex items-center justify-between pt-4">
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
                setCategoryId('');
                setPrice(0);
                setDescription('');
                setImages([]);
                setSpecs([]);
                setOriginalImages([]);
                setOriginalSpecs([]);
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
                Категория
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Цена
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => {
              const category = categories.find(cat => cat.id === product.category_id);
              return (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{category?.name || 'Не указана'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.price.toLocaleString('ru-RU')} ₽
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}