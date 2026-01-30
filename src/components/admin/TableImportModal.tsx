'use client';

import { useState, useCallback } from 'react';
import { Product, ProductImage, ProductSpec } from '@/types';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import { useNotification } from '@/hooks/useNotification';

interface TableImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

interface ParsedRow {
  [key: string]: string;
}

interface ColumnMapping {
  name: string;
  type: 'name' | 'category' | 'price' | 'description' | 'image' | 'spec';
  specType?: string;
}

interface MappedProduct {
  name: string;
  category: string;
  price: number;
  description: string;
  images: string[];
  specs: { property_name: string; value: string; spec_type_id?: string }[];
}

export default function TableImportModal({ isOpen, onClose, onImportComplete }: TableImportModalProps) {
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [columnMappings, setColumnMappings] = useState<Record<string, ColumnMapping>>({});
  const [mappedProducts, setMappedProducts] = useState<MappedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [totalRows, setTotalRows] = useState(0);

  const { showNotification, renderNotification } = useNotification();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        // Парсим CSV файл
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors.length > 0) {
              console.error('Ошибки при парсинге CSV:', results.errors);
              setError('Ошибка при парсинге CSV файла');
              setIsLoading(false);
              return;
            }

            setParsedData(results.data as ParsedRow[]);
            initializeColumnMappings(results.data as ParsedRow[]);
            setIsLoading(false);
          },
          error: (error) => {
            console.error('Ошибка при чтении CSV:', error);
            setError('Ошибка при чтении CSV файла');
            setIsLoading(false);
          }
        });
      } else if (
        file.type === 'application/vnd.ms-excel' ||
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.name.endsWith('.xls') ||
        file.name.endsWith('.xlsx')
      ) {
        // Парсим Excel файл
        const reader = new FileReader();

        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });

            // Берем первый лист
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            // Преобразуем в JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            if (jsonData.length === 0) {
              setError('Файл Excel пустой');
              setIsLoading(false);
              return;
            }

            // Первую строку считаем заголовками
            const headers = jsonData[0] as string[];
            const rows = jsonData.slice(1);

            // Преобразуем в нужный формат
            const parsedRows: ParsedRow[] = (rows as any[][]).map((row: any[]) => {
              const obj: ParsedRow = {};
              headers.forEach((header, index) => {
                obj[header] = row[index] !== undefined ? String(row[index]) : '';
              });
              return obj;
            });

            setParsedData(parsedRows);
            initializeColumnMappings(parsedRows);
            setIsLoading(false);
          } catch (parseError) {
            console.error('Ошибка при парсинге Excel файла:', parseError);
            setError('Ошибка при парсинге Excel файла');
            setIsLoading(false);
          }
        };

        reader.onerror = () => {
          setError('Ошибка при чтении Excel файла');
          setIsLoading(false);
        };

        reader.readAsArrayBuffer(file);
      } else {
        setError('Поддерживаемые форматы: CSV, XLS, XLSX');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Ошибка при обработке файла:', err);
      setError('Ошибка при обработке файла');
      setIsLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1,
    multiple: false
  });

  const initializeColumnMappings = (data: ParsedRow[]) => {
    if (data.length === 0) return;
    
    const firstRow = data[0];
    const mappings: Record<string, ColumnMapping> = {};
    
    Object.keys(firstRow).forEach(key => {
      const lowerKey = key.toLowerCase();
      
      if (lowerKey.includes('название') || lowerKey.includes('name') || lowerKey.includes('title')) {
        mappings[key] = { name: key, type: 'name' };
      } else if (lowerKey.includes('раздел') || lowerKey.includes('category') || lowerKey.includes('section')) {
        mappings[key] = { name: key, type: 'category' };
      } else if (lowerKey.includes('цена') || lowerKey.includes('price')) {
        mappings[key] = { name: key, type: 'price' };
      } else if (lowerKey.includes('описание') || lowerKey.includes('description')) {
        mappings[key] = { name: key, type: 'description' };
      } else if (lowerKey.includes('ссылка') || lowerKey.includes('url') || lowerKey.includes('image') || lowerKey.includes('link')) {
        mappings[key] = { name: key, type: 'image' };
      } else {
        // Остальные столбцы как характеристики
        mappings[key] = { name: key, type: 'spec' };
      }
    });
    
    setColumnMappings(mappings);
  };

  const handleColumnMappingChange = (columnName: string, type: ColumnMapping['type']) => {
    setColumnMappings(prev => ({
      ...prev,
      [columnName]: { ...prev[columnName], type }
    }));
  };

  const handleSpecTypeChange = (columnName: string, specType: string) => {
    setColumnMappings(prev => ({
      ...prev,
      [columnName]: { ...prev[columnName], specType }
    }));
  };

  const mapRowToProduct = (row: ParsedRow): MappedProduct => {
    const mapped: MappedProduct = {
      name: '',
      category: '',
      price: 0,
      description: '',
      images: [],
      specs: []
    };

    Object.entries(row).forEach(([key, value]) => {
      const mapping = columnMappings[key];
      if (!mapping) return;

      switch (mapping.type) {
        case 'name':
          mapped.name = value.trim();
          break;
        case 'category':
          mapped.category = value.trim();
          break;
        case 'price':
          mapped.price = parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
          break;
        case 'description':
          mapped.description = value.trim();
          break;
        case 'image':
          if (value.trim()) {
            // Проверяем, является ли значение корректным URL
            try {
              new URL(value.trim());
              mapped.images.push(value.trim());
            } catch (e) {
              console.warn(`Некорректный URL изображения: ${value.trim()}`);
            }
          }
          break;
        case 'spec':
          if (value.trim()) {
            mapped.specs.push({
              property_name: key,
              value: value.trim(),
              spec_type_id: mapping.specType || undefined
            });
          }
          break;
      }
    });

    return mapped;
  };

  const processProducts = () => {
    const products = parsedData.map(mapRowToProduct);
    setMappedProducts(products);
  };

  const handleApplyToAllSpecs = (specType: string) => {
    setColumnMappings(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        if (updated[key].type === 'spec') {
          updated[key] = { ...updated[key], specType };
        }
      });
      return updated;
    });
  };

  const importProducts = async () => {
    if (mappedProducts.length === 0) return;

    setIsLoading(true);
    setError(null);
    setProgress(0);
    setTotalRows(mappedProducts.length);

    try {
      // Сначала получим все категории и типы характеристик
      const [categoryResponse, specTypesResponse] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/spec-types')
      ]);

      if (!categoryResponse.ok) {
        throw new Error('Не удалось получить список категорий');
      }
      if (!specTypesResponse.ok) {
        throw new Error('Не удалось получить типы характеристик');
      }

      const categories = await categoryResponse.json();
      const specTypes = await specTypesResponse.json();

      // Создадим маппинг названий категорий в ID
      const categoryMap = new Map(categories.map((cat: any) => [cat.name, cat.id]));

      // Создадим маппинг типов характеристик
      const specTypeMap = new Map<string, string>(specTypes.map((st: any) => [st.filter_type, st.id]));

      // Подготовим все продукты для отправки
      const productsForImport = mappedProducts
        .map(product => {
          const categoryId = categoryMap.get(product.category);

          if (!categoryId) {
            console.warn(`Категория "${product.category}" не найдена для продукта "${product.name}"`);
            showNotification(`Категория "${product.category}" не найдена для продукта "${product.name}", продукт будет пропущен`, 'error');
            return null;
          }

          // Подготовим объект продукта для отправки
          const productPayload = {
            category_id: categoryId,
            name: product.name,
            price: product.price,
            description: product.description
          };

          // Подготовим характеристики с корректными ID типов
          const specs = product.specs.map(spec => {
            // Если spec.spec_type_id уже является UUID, используем его
            // Иначе ищем соответствующий ID по типу
            let specTypeId: string | null = spec.spec_type_id || null;

            if (spec.spec_type_id && !spec.spec_type_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
              // Это строковый тип, ищем соответствующий ID
              const foundSpecTypeId = specTypeMap.get(spec.spec_type_id);
              specTypeId = foundSpecTypeId || null;
            } else if (!spec.spec_type_id) {
              // Если тип не указан, передаем null
              specTypeId = null;
            }

            return {
              property_name: spec.property_name,
              value: spec.value,
              spec_type_id: specTypeId
            };
          });

          return {
            ...productPayload,
            images: [], // Изображения будут загружены отдельно после создания продукта
            specs
          };
        })
        .filter((product): product is Exclude<typeof product, null> => product !== null); // Убираем null значения

      // Отправим все продукты за один запрос
      const response = await fetch('/api/admin/products/batch-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Включаем куки для аутентификации
        body: JSON.stringify({ products: productsForImport })
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Ошибка при импорте продуктов';
        console.error(errorMessage);
        showNotification(errorMessage, 'error');
        return;
      }

      const createdProducts = await response.json();

      // Теперь обработаем изображения для созданных продуктов
      const productsWithImages = mappedProducts.filter(product => product.images.length > 0);

      for (let i = 0; i < productsWithImages.length; i++) {
        const product = productsWithImages[i];
        const createdProduct = createdProducts.find((p: any) => p.name === product.name);

        if (!createdProduct) continue;

        // Для каждого URL изображения нужно создать ProductImage
        for (const [index, imageUrl] of product.images.entries()) {
          try {
            // Сначала скачаем изображение по URL
            const imageResponse = await fetch(imageUrl);

            if (!imageResponse.ok) {
              console.error(`Не удалось скачать изображение: ${imageUrl}`);
              continue;
            }

            // Преобразуем в blob
            const imageBlob = await imageResponse.blob();

            // Создадим File из blob
            const fileName = imageUrl.split('/').pop() || `product_image_${Date.now()}.jpg`;
            const imageFile = new File([imageBlob], fileName, { type: imageBlob.type });

            // Создадим FormData для отправки файла на сервер
            const formData = new FormData();
            formData.append('file', imageFile);
            formData.append('folder', 'products');

            // Отправим файл на сервер для загрузки в Cloudinary
            const uploadResponse = await fetch('/api/upload', {
              method: 'POST',
              body: formData,
            });

            if (!uploadResponse.ok) {
              const errorData = await uploadResponse.json();
              console.error(`Ошибка загрузки изображения в Cloudinary:`, errorData.error);
              continue;
            }

            const uploadData = await uploadResponse.json();

            // Подготовим изображение для добавления
            const imageToAdd = {
              product_id: createdProduct.id,
              image_url: uploadData.url,
              is_main: index === 0 // Первое изображение - главное
            };

            // Отправим изображение на сервер через специальный маршрут
            const updateResponse = await fetch('/api/admin/products/add-images', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              credentials: 'include', // Включаем куки для аутентификации
              body: JSON.stringify({
                productId: createdProduct.id,
                images: [imageToAdd]
              })
            });

            if (!updateResponse.ok) {
              console.error(`Ошибка при добавлении изображения к продукту ${createdProduct.id}:`, await updateResponse.text());
            }
          } catch (error) {
            console.error(`Ошибка при обработке изображения ${imageUrl}:`, error);
          }
        }

        // Обновим прогресс
        setProgress(i + 1);
      }

      showNotification(`Успешно импортировано ${productsForImport.length} продуктов`, 'success');
      // Сообщим о завершении импорта
      onImportComplete();
      onClose();
    } catch (err: any) {
      console.error('Ошибка при импорте продуктов:', err);
      setError(err.message || 'Ошибка при импорте продуктов');
      showNotification(err.message || 'Ошибка при импорте продуктов', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Загрузить из таблицы</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          {renderNotification()}

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {!parsedData.length ? (
            <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}>
              <input {...getInputProps()} />
              <div className="flex flex-col items-center justify-center">
                <svg
                  className="w-12 h-12 text-gray-400 mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  ></path>
                </svg>
                <p className="text-gray-600">
                  {isDragActive
                    ? 'Отпустите файл здесь'
                    : 'Перетащите CSV/XLS/XLSX файл сюда или нажмите для выбора'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Поддерживаемые форматы: CSV, XLS, XLSX</p>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <h3 className="font-medium text-gray-700 mb-2">Сопоставление столбцов</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Применить тип ко всем характеристикам:
                  </label>
                  <select
                    onChange={(e) => handleApplyToAllSpecs(e.target.value)}
                    className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline w-full"
                  >
                    <option value="">Выберите тип характеристики</option>
                    <option value="SELECT">Выпадающий список</option>
                    <option value="CHECKBOXES">Чек-бокс</option>
                    <option value="RADIO">Радио-кнопка</option>
                    <option value="RANGE">Диапазон</option>
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Столбец
                        </th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Тип
                        </th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Тип характеристики
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(columnMappings).map(([key, mapping]) => (
                        <tr key={key}>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                            {key}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm">
                            <select
                              value={mapping.type}
                              onChange={(e) => handleColumnMappingChange(key, e.target.value as ColumnMapping['type'])}
                              className="shadow appearance-none border rounded py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline w-full"
                            >
                              <option value="name">Название</option>
                              <option value="category">Раздел</option>
                              <option value="price">Цена</option>
                              <option value="description">Описание</option>
                              <option value="image">Изображение</option>
                              <option value="spec">Характеристика</option>
                            </select>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm">
                            {mapping.type === 'spec' && (
                              <select
                                value={mapping.specType || ''}
                                onChange={(e) => handleSpecTypeChange(key, e.target.value)}
                                className="shadow appearance-none border rounded py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline w-full"
                              >
                                <option value="">Выберите тип</option>
                                <option value="SELECT">Выпадающий список</option>
                                <option value="CHECKBOXES">Чек-бокс</option>
                                <option value="RADIO">Радио-кнопка</option>
                                <option value="RANGE">Диапазон</option>
                              </select>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-gray-700">Предварительный просмотр</h3>
                  <button
                    onClick={processProducts}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded text-sm"
                  >
                    Обработать данные
                  </button>
                </div>

                {mappedProducts.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Название
                          </th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Раздел
                          </th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Цена
                          </th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Описание
                          </th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Изображения
                          </th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Характеристики
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {mappedProducts.slice(0, 5).map((product, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              {product.name}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              {product.category}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              {product.price.toFixed(2)}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900 max-w-xs truncate">
                              {product.description}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              {product.images.length} изображений
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              {product.specs.length} характеристик
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {mappedProducts.length > 5 && (
                      <p className="text-sm text-gray-500 mt-2">
                        Показаны первые 5 записей из {mappedProducts.length}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {isLoading && (
                <div className="mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
                      style={{ width: `${(progress / totalRows) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {progress} из {totalRows} продуктов импортировано
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded"
                  disabled={isLoading}
                >
                  Отмена
                </button>
                <button
                  onClick={importProducts}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded"
                  disabled={isLoading || mappedProducts.length === 0}
                >
                  Импортировать
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}