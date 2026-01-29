'use client';

import { useState, useEffect } from 'react';
import { HomepageBlock, getAllHomepageBlocks, createHomepageBlock, updateHomepageBlock, deleteHomepageBlock } from '@/services/homepage-structure-service';
import { useNotification } from '@/hooks/useNotification';
import FileUpload from '@/components/admin/FileUpload';

// Типы для баннеров и групп баннеров
interface BannerGroup {
  id: string;
  title: string;
  position: number;
}

// Типы для разделов главной страницы
interface HomepageSection {
  id: string;
  title: string;
  position: number;
  section_type: string;
}

interface HomepageBlocksManagerProps {
  onBlockChange?: () => void;
}

export default function HomepageBlocksManager({ onBlockChange }: HomepageBlocksManagerProps) {
  const [blocks, setBlocks] = useState<HomepageBlock[]>([]);
  const [originalBlocks, setOriginalBlocks] = useState<HomepageBlock[]>([]); // Сохраняем оригинальный порядок
  const [type, setType] = useState('');
  const [position, setPosition] = useState(1);
  const [title, setTitle] = useState('Категории');
  const [maxDisplayCount, setMaxDisplayCount] = useState(16);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [autoRotate, setAutoRotate] = useState(true);
  const [rotationInterval, setRotationInterval] = useState(5000);
  const [showIndicators, setShowIndicators] = useState(true);
  const [showNavigation, setShowNavigation] = useState(true);
  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([]);
  const [displayStyle, setDisplayStyle] = useState<'grid' | 'list' | 'carousel'>('grid');
  const [columns, setColumns] = useState(4);
  const [showPrices, setShowPrices] = useState(true);
  const [showDescriptions, setShowDescriptions] = useState(false);
  const [customContentTitle, setCustomContentTitle] = useState('');
  const [customContentText, setCustomContentText] = useState('');
  const [customContentImage, setCustomContentImage] = useState<string | null>(null);
  const [settings, setSettings] = useState('{}');
  const [visible, setVisible] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [bannerGroups, setBannerGroups] = useState<BannerGroup[]>([]);
  const [homepageSections, setHomepageSections] = useState<HomepageSection[]>([]);
  const [hasChanges, setHasChanges] = useState(false); // Состояние для отслеживания изменений

  const { showNotification, renderNotification } = useNotification();

  // Загрузка блоков, групп баннеров и разделов главной страницы
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Загружаем блоки
        const blocksData = await getAllHomepageBlocks();
        // Сортируем блоки по position
        const sortedBlocks = blocksData.sort((a, b) => a.position - b.position);
        setBlocks(sortedBlocks);
        setOriginalBlocks([...sortedBlocks]); // Сохраняем оригинальный порядок

        // Загружаем группы баннеров
        const bannerGroupsResponse = await fetch('/api/admin/banner-groups');
        if (bannerGroupsResponse.ok) {
          const bannerGroupsData = await bannerGroupsResponse.json();
          setBannerGroups(bannerGroupsData);
        } else {
          console.error('Ошибка загрузки групп баннеров:', bannerGroupsResponse.statusText);
        }

        // Загружаем разделы главной страницы
        const sectionsResponse = await fetch('/api/admin/homepage-sections');
        if (sectionsResponse.ok) {
          const sectionsData = await sectionsResponse.json();
          setHomepageSections(sectionsData);
        } else {
          console.error('Ошибка загрузки разделов главной страницы:', sectionsResponse.statusText);
        }
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        showNotification('Ошибка загрузки данных', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleBlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let parsedSettings = {};

      // Для блока типа 'categories_grid' формируем специфические настройки
      if (type === 'categories_grid') {
        parsedSettings = {
          title: title,
          max_display_count: maxDisplayCount
        };
      }
      // Для блока типа 'banner_slider' формируем специфические настройки
      else if (type === 'banner_slider') {
        parsedSettings = {
          selected_group_ids: selectedGroupIds,
          auto_rotate: autoRotate,
          rotation_interval: rotationInterval,
          show_indicators: showIndicators,
          show_navigation: showNavigation
        };
      }
      // Для блока типа 'homepage_sections' формируем специфические настройки
      else if (type === 'homepage_sections') {
        parsedSettings = {
          selected_section_ids: selectedSectionIds,
          display_style: displayStyle,
          columns: columns,
          show_prices: showPrices,
          show_descriptions: showDescriptions
        };
      }
      // Для блока типа 'custom_content' формируем специфические настройки
      else if (type === 'custom_content') {
        parsedSettings = {
          title: customContentTitle,
          text: customContentText,
          image_url: customContentImage
        };
      } else {
        // Для других типов блоков не передаем специфические настройки
        parsedSettings = {};
      }

      if (editingBlockId) {
        // Обновление существующего блока
        const updatedBlock = await updateHomepageBlock(editingBlockId, {
          type,
          settings: parsedSettings,
          visible,
          enabled
        });

        if (updatedBlock) {
          setBlocks(blocks.map(b => b.id === editingBlockId ? updatedBlock : b));
          showNotification('Блок успешно обновлен!', 'success');
        } else {
          throw new Error('Не удалось обновить блок');
        }
      } else {
        // Создание нового блока
        const newBlock = await createHomepageBlock({
          type,
          position: blocks.length + 1,
          settings: parsedSettings,
          visible,
          enabled
        });

        if (newBlock) {
          // При создании нового блока добавляем его в конец списка
          const newPosition = blocks.length + 1;
          const blockWithPosition = { ...newBlock, position: newPosition };
          setBlocks([...blocks, blockWithPosition]);
          showNotification('Блок успешно создан!', 'success');
        } else {
          throw new Error('Не удалось создать блок');
        }
      }

      // Сброс формы
      resetForm();

      // Вызов колбэка, если предоставлен
      if (onBlockChange) {
        onBlockChange();
      }
    } catch (error: any) {
      console.error('Ошибка сохранения блока:', error);
      if (error instanceof SyntaxError) {
        showNotification('Неверный формат JSON в настройках', 'error');
      } else {
        showNotification(error.message || 'Произошла ошибка при сохранении блока', 'error');
      }
    }
  };

  const handleEditBlock = (block: HomepageBlock) => {
    setType(block.type);
    // Позиция теперь управляется через перемещение, не устанавливаем напрямую

    // Для блока типа 'categories_grid' извлекаем специфические настройки
    if (block.type === 'categories_grid') {
      setTitle(block.settings.title || 'Категории');
      setMaxDisplayCount(block.settings.max_display_count || 16);
    }
    // Для блока типа 'banner_slider' извлекаем специфические настройки
    else if (block.type === 'banner_slider') {
      setSelectedGroupIds(block.settings.selected_group_ids || []);
      setAutoRotate(block.settings.auto_rotate !== undefined ? block.settings.auto_rotate : true);
      setRotationInterval(block.settings.rotation_interval || 5000);
      setShowIndicators(block.settings.show_indicators !== undefined ? block.settings.show_indicators : true);
      setShowNavigation(block.settings.show_navigation !== undefined ? block.settings.show_navigation : true);
    }
    // Для блока типа 'homepage_sections' извлекаем специфические настройки
    else if (block.type === 'homepage_sections') {
      setSelectedSectionIds(block.settings.selected_section_ids || []);
      setDisplayStyle(block.settings.display_style || 'grid');
      setColumns(block.settings.columns || 4);
      setShowPrices(block.settings.show_prices !== undefined ? block.settings.show_prices : true);
      setShowDescriptions(block.settings.show_descriptions || false);
    }
    // Для блока типа 'custom_content' извлекаем специфические настройки
    else if (block.type === 'custom_content') {
      setCustomContentTitle(block.settings.title || '');
      setCustomContentText(block.settings.text || '');
      setCustomContentImage(block.settings.image_url || null);
    } else {
      // Для других типов блоков не устанавливаем специфические настройки
      setSettings('{}');
    }

    setVisible(block.visible);
    setEnabled(block.enabled);
    setEditingBlockId(block.id);
  };

  const handleDeleteBlock = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этот блок?')) {
      try {
        const success = await deleteHomepageBlock(id);

        if (success) {
          // Обновляем список блоков без удаленного и пересчитываем порядок
          const filteredBlocks = blocks.filter(b => b.id !== id);
          const reorderedBlocks = filteredBlocks.map((block, index) => ({
            ...block,
            position: index + 1  // Позиции начинаются с 1
          }));

          setBlocks(reorderedBlocks);
          showNotification('Блок успешно удален!', 'success');

          // Вызов колбэка, если предоставлен
          if (onBlockChange) {
            onBlockChange();
          }
        } else {
          throw new Error('Не удалось удалить блок');
        }
      } catch (error: any) {
        console.error('Ошибка удаления блока:', error);
        showNotification(error.message || 'Произошла ошибка при удалении блока', 'error');
      }
    }
  };

  const resetForm = () => {
    setType('');
    setPosition(1); // Позиция будет определена автоматически при сохранении
    setTitle('Категории');
    setMaxDisplayCount(16);
    setSelectedGroupIds([]);
    setAutoRotate(true);
    setRotationInterval(5000);
    setShowIndicators(true);
    setShowNavigation(true);
    setSelectedSectionIds([]);
    setDisplayStyle('grid');
    setColumns(4);
    setShowPrices(true);
    setShowDescriptions(false);
    setCustomContentTitle('');
    setCustomContentText('');
    setCustomContentImage(null);
    setSettings('{}');
    setVisible(true);
    setEnabled(true);
    setEditingBlockId(null);
  };

  const moveBlockUp = (index: number) => {
    if (index === 0) return; // Первый блок, нельзя двигать выше

    // Создаем новый массив с обновленным порядком
    const newBlocks = [...blocks];

    // Меняем местами элементы
    [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];

    // Обновляем position для всех блоков
    const updatedBlocks = newBlocks.map((block, idx) => ({
      ...block,
      position: idx + 1  // Позиции начинаются с 1
    }));

    setBlocks(updatedBlocks);
    setHasChanges(true); // Устанавливаем флаг изменений
  };

  const moveBlockDown = (index: number) => {
    if (index === blocks.length - 1) return; // Последний блок, нельзя двигать ниже

    // Создаем новый массив с обновленным порядком
    const newBlocks = [...blocks];

    // Меняем местами элементы
    [newBlocks[index + 1], newBlocks[index]] = [newBlocks[index], newBlocks[index + 1]];

    // Обновляем position для всех блоков
    const updatedBlocks = newBlocks.map((block, idx) => ({
      ...block,
      position: idx + 1  // Позиции начинаются с 1
    }));

    setBlocks(updatedBlocks);
    setHasChanges(true); // Устанавливаем флаг изменений
  };

  // Функция для сохранения изменений порядка блоков
  const saveOrderChanges = async () => {
    try {
      // Отправляем все изменения в одном запросе
      const response = await fetch('/api/admin/homepage-blocks/update-order', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blocks: blocks.map(block => ({
            id: block.id,
            position: block.position
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка сохранения порядка блоков');
      }

      showNotification('Порядок блоков успешно сохранен!', 'success');
      setHasChanges(false); // Сбрасываем флаг изменений
    } catch (error: any) {
      console.error('Ошибка сохранения порядка блоков:', error);
      showNotification(error.message || 'Произошла ошибка при сохранении порядка блоков', 'error');
      // В случае ошибки восстанавливаем исходный порядок
      setBlocks([...originalBlocks]);
      setHasChanges(false);
    }
  };

  // Функция для отмены изменений
  const cancelOrderChanges = () => {
    setBlocks([...originalBlocks]); // Восстанавливаем исходный порядок
    setHasChanges(false); // Сбрасываем флаг изменений
  };

  // Типы блоков для выпадающего списка
  const blockTypes = [
    { value: 'categories_grid', label: 'Сетка категорий' },
    { value: 'banner_slider', label: 'Слайдер баннеров' },
    { value: 'homepage_sections', label: 'Разделы главной страницы' },
    { value: 'custom_content', label: 'Пользовательский контент' }
  ];

  if (loading) {
    return <div className="p-4">Загрузка блоков...</div>;
  }

  return (
    <div className="p-6">
      {renderNotification()}
      
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {editingBlockId ? 'Редактировать блок' : 'Добавить новый блок'}
      </h2>

      <form onSubmit={handleBlockSubmit} className="mb-8 p-4 bg-white rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="type">
              Тип блока
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              <option value="">Выберите тип блока</option>
              {blockTypes.map((blockType) => (
                <option key={blockType.value} value={blockType.value}>
                  {blockType.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={visible}
              onChange={(e) => {
                setVisible(e.target.checked);
                setEnabled(e.target.checked); // Одновременно включаем/отключаем
              }}
              className="mr-2"
            />
            <span className="text-gray-700">Видимый</span>
          </label>
        </div>

        {/* Специфические настройки для блока 'categories_grid' */}
        {type === 'categories_grid' ? (
          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                Название
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Введите название для сетки категорий"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="maxDisplayCount">
                Максимальное количество категорий
              </label>
              <input
                id="maxDisplayCount"
                type="number"
                value={maxDisplayCount}
                onChange={(e) => setMaxDisplayCount(parseInt(e.target.value) || 16)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                min="1"
                max="100"
              />
            </div>
          </div>
        ) : type === 'banner_slider' ? (
          // Специфические настройки для блока 'banner_slider'
          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Выбор групп баннеров
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border rounded">
                {bannerGroups.map((group) => (
                  <div key={group.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`group-${group.id}`}
                      checked={selectedGroupIds.includes(group.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedGroupIds([...selectedGroupIds, group.id]);
                        } else {
                          setSelectedGroupIds(selectedGroupIds.filter(id => id !== group.id));
                        }
                      }}
                      className="mr-2"
                    />
                    <label htmlFor={`group-${group.id}`} className="text-gray-700">
                      {group.title}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={autoRotate}
                    onChange={(e) => setAutoRotate(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-gray-700">Автоматическая прокрутка</span>
                </label>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="rotationInterval">
                  Время прокрутки (мс)
                </label>
                <input
                  id="rotationInterval"
                  type="number"
                  value={rotationInterval}
                  onChange={(e) => setRotationInterval(parseInt(e.target.value) || 5000)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  min="1000"
                  step="100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showIndicators}
                    onChange={(e) => setShowIndicators(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-gray-700">Показывать индикаторы (точки)</span>
                </label>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showNavigation}
                    onChange={(e) => setShowNavigation(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-gray-700">Показывать навигацию (стрелки)</span>
                </label>
              </div>
            </div>
          </div>
        ) : type === 'homepage_sections' ? (
          // Специфические настройки для блока 'homepage_sections'
          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Выбор разделов главной страницы
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border rounded">
                {homepageSections.map((section) => (
                  <div key={section.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`section-${section.id}`}
                      checked={selectedSectionIds.includes(section.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSectionIds([...selectedSectionIds, section.id]);
                        } else {
                          setSelectedSectionIds(selectedSectionIds.filter(id => id !== section.id));
                        }
                      }}
                      className="mr-2"
                    />
                    <label htmlFor={`section-${section.id}`} className="text-gray-700">
                      {section.title} ({section.section_type})
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="displayStyle">
                  Стиль отображения
                </label>
                <select
                  id="displayStyle"
                  value={displayStyle}
                  onChange={(e) => setDisplayStyle(e.target.value as 'grid' | 'list' | 'carousel')}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="grid">Сетка</option>
                  <option value="list">Список</option>
                  <option value="carousel">Карусель</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="columns">
                  Количество колонок
                </label>
                <input
                  id="columns"
                  type="number"
                  value={columns}
                  onChange={(e) => setColumns(parseInt(e.target.value) || 4)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  min="1"
                  max="12"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showPrices}
                    onChange={(e) => setShowPrices(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-gray-700">Показывать цены</span>
                </label>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showDescriptions}
                    onChange={(e) => setShowDescriptions(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-gray-700">Показывать описания</span>
                </label>
              </div>
            </div>
          </div>
        ) : type === 'custom_content' ? (
          // Специфические настройки для блока 'custom_content'
          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="customContentTitle">
                Название
              </label>
              <input
                id="customContentTitle"
                type="text"
                value={customContentTitle}
                onChange={(e) => setCustomContentTitle(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Введите название для блока пользовательского контента"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="customContentText">
                Текст
              </label>
              <textarea
                id="customContentText"
                value={customContentText}
                onChange={(e) => setCustomContentText(e.target.value)}
                rows={6}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Введите текст для блока пользовательского контента"
              />
            </div>

            <div>
              {customContentImage && (
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Текущее изображение
                  </label>
                  <div className="flex items-center">
                    <img
                      src={customContentImage}
                      alt="Текущее изображение пользовательского контента"
                      className="h-16 w-16 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => setCustomContentImage(null)}
                      className="ml-4 text-red-600 hover:text-red-800 text-sm"
                    >
                      Удалить изображение
                    </button>
                  </div>
                </div>
              )}
              <FileUpload
                onFileUpload={(urls) => setCustomContentImage(urls[0] || null)}
                folder="custom-content"
                label="Загрузить изображение для пользовательского контента"
              />
            </div>
          </div>
        ) : (
          // Для других типов блоков показываем сообщение
          <div className="mb-4">
            <p className="text-gray-700">Для выбранного типа блока дополнительные настройки не предусмотрены.</p>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            {editingBlockId ? 'Обновить' : 'Создать'}
          </button>
          {editingBlockId && (
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
        {hasChanges && (
          <div className="bg-yellow-50 border-b border-yellow-200 p-4 flex justify-between">
            <span className="text-yellow-700">Есть несохраненные изменения порядка блоков</span>
            <div className="space-x-2">
              <button
                onClick={saveOrderChanges}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-1 px-3 rounded text-sm"
              >
                Сохранить изменения
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
                Тип
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Видимый
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
            {blocks.map((block, index) => (
              <tr key={block.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 capitalize">{block.type.replace('_', ' ')}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`text-sm ${block.visible && block.enabled ? 'text-green-600 font-semibold' : 'text-red-600'}`}>
                    {(block.visible && block.enabled) ? 'Да' : 'Нет'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => moveBlockUp(index)}
                      disabled={index === 0}
                      className={`p-1 rounded ${index === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-blue-600'}`}
                      title="Переместить вверх"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveBlockDown(index)}
                      disabled={index === blocks.length - 1}
                      className={`p-1 rounded ${index === blocks.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-blue-600'}`}
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
                    onClick={() => handleEditBlock(block)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Редактировать
                  </button>
                  <button
                    onClick={() => handleDeleteBlock(block.id)}
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