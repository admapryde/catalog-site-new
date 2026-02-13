'use client';

import { useState, useEffect } from 'react';
import { HomepageSection, HomepageSectionItem, Product } from '@/types';
import { useNotification } from '@/hooks/useNotification';

export default function HomepageSectionsManager() {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [originalSections, setOriginalSections] = useState<HomepageSection[]>([]); // Сохраняем оригинальный порядок
  const [sectionItems, setSectionItems] = useState<HomepageSectionItem[]>([]);
  const [originalSectionItems, setOriginalSectionItems] = useState<HomepageSectionItem[]>([]); // Сохраняем оригинальный порядок
  const [products, setProducts] = useState<Product[]>([]);
  const [title, setTitle] = useState('');
  const [sectionType, setSectionType] = useState('');
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'sections' | 'items'>('sections');
  const [loading, setLoading] = useState(true);

  const { showNotification, renderNotification } = useNotification();

  // Для управления элементами разделов
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const [hasSectionChanges, setHasSectionChanges] = useState(false); // Состояние для отслеживания изменений разделов
  const [hasItemChanges, setHasItemChanges] = useState(false); // Состояние для отслеживания изменений элементов


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
        // Сортируем разделы по position
        const sortedSections = sectionsData.sort((a, b) => a.position - b.position);
        setSections(sortedSections);
        setOriginalSections([...sortedSections]); // Сохраняем оригинальный порядок

        // Загрузка элементов разделов
        const itemsResponse = await fetch('/api/admin/homepage-section-items');
        if (!itemsResponse.ok) {
          throw new Error('Ошибка загрузки элементов разделов');
        }
        const itemsData: HomepageSectionItem[] = await itemsResponse.json();
        setSectionItems(itemsData);
        setOriginalSectionItems([...itemsData]); // Сохраняем оригинальный порядок

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

  // Сортировка элементов разделов при изменении элементов или разделов
  useEffect(() => {
    if (sectionItems.length > 0 && sections.length > 0) {
      // Сортируем элементы по разделам (в соответствии с порядком разделов) и внутри разделов по sort_order
      const sortedItems = [...sectionItems].sort((a, b) => {
        // Находим позиции разделов в отсортированном списке разделов
        const sectionA = sections.find(s => s.id === a.section_id);
        const sectionB = sections.find(s => s.id === b.section_id);

        if (sectionA && sectionB) {
          // Сортируем по позиции раздела, затем внутри раздела по sort_order
          if (sectionA.position !== sectionB.position) {
            return sectionA.position - sectionB.position;
          }
        }

        // Если разделы не найдены или имеют одинаковую позицию, сортируем по ID раздела, затем по sort_order
        if (a.section_id !== b.section_id) {
          const sectionAIndex = sections.findIndex(s => s.id === a.section_id);
          const sectionBIndex = sections.findIndex(s => s.id === b.section_id);
          return sectionAIndex - sectionBIndex;
        }

        // Потом внутри раздела по sort_order
        return a.sort_order - b.sort_order;
      });

      // Проверяем, изменился ли порядок
      const isDifferent = sortedItems.some((item, index) => item.id !== sectionItems[index]?.id);
      if (isDifferent) {
        setSectionItems(sortedItems);
      }
    }
  }, [sectionItems, sections]);

  const handleSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingSectionId) {
        // Обновление существующего раздела (сохраняем текущую позицию)
        const currentSection = sections.find(s => s.id === editingSectionId);
        const response = await fetch('/api/admin/homepage-sections', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingSectionId,
            title,
            position: currentSection?.position,
            section_type: sectionType // Используем значение из состояния
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Ошибка обновления раздела');
        }

        const updatedSection = await response.json();
        setSections(sections.map(s =>
          s.id === editingSectionId ? updatedSection[0] : s
        ));

        showNotification('Раздел успешно обновлен!', 'success');
      } else {
        // Создание нового раздела
        const response = await fetch('/api/admin/homepage-sections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            position: sections.length + 1,
            section_type: sectionType || null // Используем значение из состояния
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Ошибка создания раздела');
        }

        const newSection = await response.json();
        // Добавляем новую секцию в конец списка с правильным порядковым номером
        const updatedSections = [...sections, newSection[0]].sort((a, b) => a.position - b.position);
        setSections(updatedSections);

        showNotification('Раздел успешно создан!', 'success');
      }

      // Сброс формы
      setTitle('');
      setSectionType('');
      setEditingSectionId(null);
    } catch (error: any) {
      console.error('Ошибка сохранения раздела:', error);
      showNotification(error.message || 'Произошла ошибка при сохранения раздела', 'error');
    }
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Проверяем, что все обязательные поля заполнены
    if (!selectedSectionId || !selectedProductId) {
      alert('Пожалуйста, заполните все обязательные поля');
      return;
    }

    try {
      if (editingItemId) {
        // Обновление существующего элемента (сохраняем текущий порядок сортировки)
        const currentItem = sectionItems.find(i => i.id === editingItemId);
        const response = await fetch('/api/admin/homepage-section-items', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingItemId,
            section_id: selectedSectionId,
            product_id: selectedProductId,
            sort_order: currentItem?.sort_order
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
        // Проверяем, не существует ли уже такой элемент в этом разделе
        const existingItem = sectionItems.find(
          item => item.section_id === selectedSectionId && item.product_id === selectedProductId
        );

        if (existingItem) {
          alert('Этот товар уже добавлен в данный раздел');
          return;
        }

        // Определяем порядок сортировки как количество элементов в разделе
        const itemsInSection = sectionItems.filter(i => i.section_id === selectedSectionId);
        const newSortOrder = itemsInSection.length;

        const response = await fetch('/api/admin/homepage-section-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            section_id: selectedSectionId,
            product_id: selectedProductId,
            sort_order: newSortOrder
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Ошибка создания элемента:', errorText);
          throw new Error(`Ошибка создания элемента раздела: ${response.status}`);
        }

        const newItem = await response.json();
        // После добавления элемента обновляем список и сортируем
        const updatedSectionItems = [...sectionItems, newItem[0]];
        // Сортируем элементы по разделам и их порядку
        const sortedUpdatedItems = [...updatedSectionItems].sort((a, b) => {
          // Находим позиции разделов в основном списке разделов
          const sectionA = sections.find(s => s.id === a.section_id);
          const sectionB = sections.find(s => s.id === b.section_id);

          if (sectionA && sectionB) {
            // Сортируем по позиции раздела, затем внутри раздела по sort_order
            if (sectionA.position !== sectionB.position) {
              return sectionA.position - sectionB.position;
            }
          }

          // Если разделы не найдены или имеют одинаковую позицию, сортируем по ID раздела, затем по sort_order
          if (a.section_id !== b.section_id) {
            const sectionAIndex = sections.findIndex(s => s.id === a.section_id);
            const sectionBIndex = sections.findIndex(s => s.id === b.section_id);
            return sectionAIndex - sectionBIndex;
          }

          // Потом внутри раздела по sort_order
          return a.sort_order - b.sort_order;
        });

        setSectionItems(sortedUpdatedItems);
      }

      // Сброс формы
      setSelectedSectionId('');
      setSelectedProductId('');
      setEditingItemId(null);
    } catch (error) {
      console.error('Ошибка сохранения элемента раздела:', error);
    }
  };

  const handleEditSection = (section: HomepageSection) => {
    setTitle(section.title);
    setSectionType(section.section_type || '');
    setEditingSectionId(section.id);
    setActiveTab('sections');
  };

  const handleEditItem = (item: HomepageSectionItem) => {
    setSelectedSectionId(item.section_id);
    setSelectedProductId(item.product_id);
    setEditingItemId(item.id);
    setActiveTab('items');
  };

  const handleDeleteSection = async (id: string) => {
    const sectionToDelete = sections.find(s => s.id === id);

    // Не позволяем удалять специальный раздел заголовка сетки категорий
    if (sectionToDelete?.section_type === 'categories_grid') {
      showNotification('Нельзя удалить заголовок сетки категорий. Его можно только редактировать.', 'error');
      return;
    }

    if (confirm('Вы уверены, что хотите удалить этот раздел?')) {
      try {
        const response = await fetch(`/api/admin/homepage-sections?id=${id}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Ошибка удаления раздела');
        }

        // Обновляем список разделов без удаленного и пересчитываем порядок
        const filteredSections = sections.filter(s => s.id !== id);
        const reorderedSections = filteredSections.map((section, index) => ({
          ...section,
          position: index + 1  // Позиции начинаются с 1
        }));

        setSections(reorderedSections);
        // Также удалим связанные элементы
        setSectionItems(sectionItems.filter(i => i.section_id !== id));

        showNotification('Раздел успешно удален!', 'success');
      } catch (error: any) {
        console.error('Ошибка удаления раздела:', error);
        showNotification(error.message || 'Произошла ошибка при удаления раздела', 'error');
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

        // Обновляем список элементов без удаленного и пересчитываем порядок в разделе
        const deletedItem = sectionItems.find(item => item.id === id);
        const filteredItems = sectionItems.filter(i => i.id !== id);

        if (deletedItem) {
          // Получаем оставшиеся элементы в том же разделе и перенумеровываем их
          const itemsInSection = filteredItems.filter(item => item.section_id === deletedItem.section_id);
          const reorderedItemsInSection = itemsInSection.map((item, index) => ({
            ...item,
            sort_order: index
          }));

          // Обновляем все элементы в этом разделе
          const updatedSectionItems = filteredItems.map(item => {
            const reorderedItem = reorderedItemsInSection.find(reordered => reordered.id === item.id);
            return reorderedItem ? { ...item, sort_order: reorderedItem.sort_order } : item;
          });

          setSectionItems(updatedSectionItems);
        } else {
          setSectionItems(filteredItems);
        }
      } catch (error) {
        console.error('Ошибка удаления элемента:', error);
      }
    }
  };

  const moveSectionUp = (index: number) => {
    if (index === 0) return; // Первая секция, нельзя двигать выше

    const sectionToMove = sections[index];
    // Не позволяем перемещать специальный раздел
    if (sectionToMove.section_type === 'categories_grid') {
      showNotification('Нельзя перемещать заголовок сетки категорий.', 'error');
      return;
    }

    // Создаем новый массив с обновленным порядком
    const newSections = [...sections];

    // Меняем местами элементы
    [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];

    // Обновляем position для всех секций
    const updatedSections = newSections.map((section, idx) => ({
      ...section,
      position: idx + 1  // Позиции начинаются с 1
    }));

    setSections(updatedSections);
    setHasSectionChanges(true); // Устанавливаем флаг изменений
  };

  const moveSectionDown = (index: number) => {
    if (index === sections.length - 1) return; // Последняя секция, нельзя двигать ниже

    const sectionToMove = sections[index];
    // Не позволяем перемещать специальный раздел
    if (sectionToMove.section_type === 'categories_grid') {
      showNotification('Нельзя перемещать заголовок сетки категорий.', 'error');
      return;
    }

    // Создаем новый массив с обновленным порядком
    const newSections = [...sections];

    // Меняем местами элементы
    [newSections[index + 1], newSections[index]] = [newSections[index], newSections[index + 1]];

    // Обновляем position для всех секций
    const updatedSections = newSections.map((section, idx) => ({
      ...section,
      position: idx + 1  // Позиции начинаются с 1
    }));

    setSections(updatedSections);
    setHasSectionChanges(true); // Устанавливаем флаг изменений
  };

  const moveItemUp = (itemId: string) => {
    const itemToMove = sectionItems.find(b => b.id === itemId);
    if (!itemToMove) return;

    // Получаем все элементы в том же разделе
    const itemsInSection = sectionItems.filter(b => b.section_id === itemToMove.section_id);
    const currentIndex = itemsInSection.findIndex(b => b.id === itemId);

    if (currentIndex === 0) return; // Уже первый в разделе

    // Создаем новый массив с обновленным порядком
    const newItemsInSection = [...itemsInSection];
    const movedItem = newItemsInSection.splice(currentIndex, 1)[0];
    newItemsInSection.splice(currentIndex - 1, 0, movedItem);

    // Обновляем sort_order для элементов в разделе
    const reorderedItemsInSection = newItemsInSection.map((item, idx) => ({
      ...item,
      sort_order: idx
    }));

    // Обновляем весь список элементов
    const updatedSectionItems = sectionItems.map(item => {
      const updatedItem = reorderedItemsInSection.find(updated => updated.id === item.id);
      return updatedItem || item;
    });

    setSectionItems(updatedSectionItems);
    setHasItemChanges(true); // Устанавливаем флаг изменений
  };

  const moveItemDown = (itemId: string) => {
    const itemToMove = sectionItems.find(b => b.id === itemId);
    if (!itemToMove) return;

    // Получаем все элементы в том же разделе
    const itemsInSection = sectionItems.filter(b => b.section_id === itemToMove.section_id);
    const currentIndex = itemsInSection.findIndex(b => b.id === itemId);

    if (currentIndex === itemsInSection.length - 1) return; // Уже последний в разделе

    // Создаем новый массив с обновленным порядком
    const newItemsInSection = [...itemsInSection];
    const movedItem = newItemsInSection.splice(currentIndex, 1)[0];
    newItemsInSection.splice(currentIndex + 1, 0, movedItem);

    // Обновляем sort_order для элементов в разделе
    const reorderedItemsInSection = newItemsInSection.map((item, idx) => ({
      ...item,
      sort_order: idx
    }));

    // Обновляем весь список элементов
    const updatedSectionItems = sectionItems.map(item => {
      const updatedItem = reorderedItemsInSection.find(updated => updated.id === item.id);
      return updatedItem || item;
    });

    setSectionItems(updatedSectionItems);
    setHasItemChanges(true); // Устанавливаем флаг изменений
  };

  // Функция для сохранения изменений порядка разделов
  const saveSectionOrderChanges = async () => {
    try {
      // Отправляем все изменения в одном запросе
      const response = await fetch('/api/admin/homepage-sections/update-order', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sections: sections.map(section => ({
            id: section.id,
            position: section.position
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка сохранения порядка разделов');
      }

      showNotification('Порядок разделов успешно сохранен!', 'success');
      setHasSectionChanges(false); // Сбрасываем флаг изменений
    } catch (error: any) {
      console.error('Ошибка сохранения порядка разделов:', error);
      showNotification(error.message || 'Произошла ошибка при сохранении порядка разделов', 'error');
      // В случае ошибки восстанавливаем исходный порядок
      setSections([...originalSections]);
      setHasSectionChanges(false);
    }
  };

  // Функция для отмены изменений разделов
  const cancelSectionOrderChanges = () => {
    setSections([...originalSections]); // Восстанавливаем исходный порядок
    setHasSectionChanges(false); // Сбрасываем флаг изменений
  };

  // Функция для сохранения изменений порядка элементов
  const saveItemOrderChanges = async () => {
    try {
      // Отправляем все изменения в одном запросе
      const response = await fetch('/api/admin/homepage-section-items/update-order', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: sectionItems.map(item => ({
            id: item.id,
            section_id: item.section_id,
            sort_order: item.sort_order
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка сохранения порядка элементов');
      }

      showNotification('Порядок элементов успешно сохранен!', 'success');
      setHasItemChanges(false); // Сбрасываем флаг изменений
    } catch (error: any) {
      console.error('Ошибка сохранения порядка элементов:', error);
      showNotification(error.message || 'Произошла ошибка при сохранении порядка элементов', 'error');
      // В случае ошибки восстанавливаем исходный порядок
      setSectionItems([...originalSectionItems]);
      setHasItemChanges(false);
    }
  };

  // Функция для отмены изменений элементов
  const cancelItemOrderChanges = () => {
    setSectionItems([...originalSectionItems]); // Восстанавливаем исходный порядок
    setHasItemChanges(false); // Сбрасываем флаг изменений
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
            <div className="mb-4">
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
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="sectionType">
                Тип раздела
              </label>
              <input
                id="sectionType"
                type="text"
                value={sectionType}
                onChange={(e) => setSectionType(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Введите тип раздела (например: categories_grid)"
              />
              <p className="text-sm text-gray-500 mt-1">Оставьте пустым для обычного раздела, используйте 'categories_grid' для заголовка сетки категорий</p>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-x-2">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  {editingSectionId ? 'Обновить' : 'Создать'}
                </button>
              </div>
              {editingSectionId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingSectionId(null);
                    setTitle('');
                    setSectionType('');
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Отмена
                </button>
              )}
            </div>
          </form>

          {/* Кнопка для создания специального раздела "categories_grid" если его нет */}
          {!sections.some(s => s.section_type === 'categories_grid') && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-lg font-bold text-blue-800 mb-2">Специальный раздел</h3>
              <p className="text-gray-700 mb-3">Заголовок сетки категорий ещё не создан. Создайте его, чтобы управлять названием "Категории" на главной странице.</p>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/admin/homepage-sections', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        title: 'Категории',
                        position: sections.length + 1,
                        section_type: 'categories_grid'
                      })
                    });

                    if (!response.ok) {
                      const errorData = await response.json();
                      throw new Error(errorData.error || 'Ошибка создания заголовка сетки категорий');
                    }

                    const newSection = await response.json();

                    // Обновляем состояние
                    const updatedSections = [...sections, newSection[0]].sort((a, b) => a.position - b.position);
                    setSections(updatedSections);

                    showNotification('Заголовок сетки категорий успешно создан!', 'success');
                  } catch (error: any) {
                    console.error('Ошибка создания заголовка сетки категорий:', error);
                    showNotification(error.message || 'Произошла ошибка при создании заголовка сетки категорий', 'error');
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Создать заголовок сетки категорий
              </button>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {hasSectionChanges && (
              <div className="bg-yellow-50 border-b border-yellow-200 p-4 flex justify-between">
                <span className="text-yellow-700">Есть несохраненные изменения порядка разделов</span>
                <div className="space-x-2">
                  <button
                    onClick={saveSectionOrderChanges}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-1 px-3 rounded text-sm"
                  >
                    Сохранить изменения
                  </button>
                  <button
                    onClick={cancelSectionOrderChanges}
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
                    Тип
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
                {sections.map((section, index) => {
                  const isSpecialSection = section.section_type === 'categories_grid';
                  return (
                    <tr
                      key={section.id}
                      className={`${isSpecialSection ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${isSpecialSection ? 'font-semibold text-blue-700' : 'font-medium text-gray-900'}`}>
                          {section.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${isSpecialSection ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                          {section.section_type || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => moveSectionUp(index)}
                            disabled={index === 0 || isSpecialSection}
                            className={`p-1 rounded ${(index === 0 || isSpecialSection) ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-blue-600'}`}
                            title={isSpecialSection ? 'Перемещение запрещено для специального раздела' : 'Переместить вверх'}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <button
                            onClick={() => moveSectionDown(index)}
                            disabled={index === sections.length - 1 || isSpecialSection}
                            className={`p-1 rounded ${(index === sections.length - 1 || isSpecialSection) ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-blue-600'}`}
                            title={isSpecialSection ? 'Перемещение запрещено для специального раздела' : 'Переместить вниз'}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditSection(section)}
                          className={`${isSpecialSection ? 'text-blue-600 hover:text-blue-800' : 'text-indigo-600 hover:text-indigo-900'} mr-4`}
                        >
                          Редактировать
                        </button>
                        <button
                          onClick={() => handleDeleteSection(section.id)}
                          className={`${isSpecialSection ? 'text-blue-400 hover:text-blue-600 cursor-not-allowed' : 'text-red-600 hover:text-red-900'}`}
                          disabled={isSpecialSection}
                          title={isSpecialSection ? 'Удаление запрещено для специального раздела' : undefined}
                        >
                          {isSpecialSection ? 'Заблокировано' : 'Удалить'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Отмена
                </button>
              )}
            </div>
          </form>

          {/* Отображение отдельной таблицы для каждого раздела */}
          {hasItemChanges && (
            <div className="bg-yellow-50 border-b border-yellow-200 p-4 mb-4 flex justify-between">
              <span className="text-yellow-700">Есть несохраненные изменения порядка элементов</span>
              <div className="space-x-2">
                <button
                  onClick={saveItemOrderChanges}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-1 px-3 rounded text-sm"
                >
                  Сохранить изменения
                </button>
                <button
                  onClick={cancelItemOrderChanges}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-1 px-3 rounded text-sm"
                >
                  Отменить
                </button>
              </div>
            </div>
          )}
          {sections.map((section) => {
            const sectionItemsForSection = sectionItems.filter(item => item.section_id === section.id);

            return (
              <div key={section.id} className="mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">{section.title}</h3>
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Товар
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
                      {sectionItemsForSection.map((item, index) => {
                        const product = products.find(p => p.id === item.product_id);

                        return (
                          <tr key={item.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{product?.name || 'Не указан'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => moveItemUp(item.id)}
                                  disabled={index === 0}
                                  className={`p-1 rounded ${index === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-blue-600'}`}
                                  title="Переместить вверх"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => moveItemDown(item.id)}
                                  disabled={index === sectionItemsForSection.length - 1}
                                  className={`p-1 rounded ${index === sectionItemsForSection.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-blue-600'}`}
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
            );
          })}
        </div>
      )}
      
    </div>
  );
}