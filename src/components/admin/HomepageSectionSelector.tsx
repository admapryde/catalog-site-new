'use client';

import { useState, useEffect } from 'react';
import { HomepageSection } from '@/types';

interface HomepageSectionSelectorProps {
  productId: string;
  initialSections: HomepageSection[];
  onUpdate: () => void;
}

export default function HomepageSectionSelector({ productId, initialSections, onUpdate }: HomepageSectionSelectorProps) {
  const [availableSections, setAvailableSections] = useState<HomepageSection[]>([]);
  const [assignedSections, setAssignedSections] = useState<string[]>([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [loading, setLoading] = useState(true);

  // Загрузка всех разделов и назначенных разделов для продукта
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Загрузка всех доступных разделов
        const sectionsResponse = await fetch('/api/admin/homepage-sections');
        if (!sectionsResponse.ok) {
          throw new Error('Ошибка загрузки разделов');
        }
        const sectionsData: HomepageSection[] = await sectionsResponse.json();
        setAvailableSections(sectionsData);

        // Загрузка назначенных разделов для этого продукта
        const assignedResponse = await fetch('/api/admin/homepage-section-items');
        if (!assignedResponse.ok) {
          throw new Error('Ошибка загрузки назначенных разделов');
        }
        const assignedData = await assignedResponse.json();
        
        // Фильтруем только те, что относятся к данному продукту
        const productAssignedSections = assignedData
          .filter((item: any) => item.product_id === productId)
          .map((item: any) => item.section_id);
        
        setAssignedSections(productAssignedSections);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchData();
    }
  }, [productId]);

  const handleAddToSection = async () => {
    if (!selectedSection || assignedSections.includes(selectedSection)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/homepage-section-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section_id: selectedSection,
          product_id: productId,
          sort_order: 0
        })
      });

      if (!response.ok) {
        throw new Error('Ошибка добавления товара в раздел');
      }

      setAssignedSections([...assignedSections, selectedSection]);
      setSelectedSection('');
      onUpdate(); // Уведомляем родительский компонент об изменении
    } catch (error) {
      console.error('Ошибка добавления товара в раздел:', error);
    }
  };

  const handleRemoveFromSection = async (sectionId: string) => {
    try {
      // Нужно найти ID элемента, который связывает продукт с разделом
      const assignedResponse = await fetch('/api/admin/homepage-section-items');
      if (!assignedResponse.ok) {
        throw new Error('Ошибка загрузки назначенных разделов');
      }
      const assignedData = await assignedResponse.json();
      
      const itemToRemove = assignedData.find((item: any) => 
        item.product_id === productId && item.section_id === sectionId
      );

      if (!itemToRemove) {
        throw new Error('Элемент не найден');
      }

      const response = await fetch(`/api/admin/homepage-section-items?id=${itemToRemove.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Ошибка удаления товара из раздела');
      }

      setAssignedSections(assignedSections.filter(id => id !== sectionId));
      onUpdate(); // Уведомляем родительский компонент об изменении
    } catch (error) {
      console.error('Ошибка удаления товара из раздела:', error);
    }
  };

  if (loading) {
    return <div>Загрузка разделов...</div>;
  }

  return (
    <div className="mt-4">
      <h4 className="text-md font-medium text-gray-700 mb-2">Добавить в раздел ГС</h4>
      <div className="flex gap-2">
        <select
          value={selectedSection}
          onChange={(e) => setSelectedSection(e.target.value)}
          className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline flex-grow"
        >
          <option value="">Выберите раздел</option>
          {availableSections
            .filter(section => !assignedSections.includes(section.id))
            .map(section => (
              <option key={section.id} value={section.id}>
                {section.title}
              </option>
            ))}
        </select>
        <button
          type="button"
          onClick={handleAddToSection}
          disabled={!selectedSection}
          className={`py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
            selectedSection 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Добавить
        </button>
      </div>

      {assignedSections.length > 0 && (
        <div className="mt-4">
          <h5 className="text-sm font-medium text-gray-600 mb-2">Назначенные разделы:</h5>
          <div className="flex flex-wrap gap-2">
            {assignedSections.map(sectionId => {
              const section = availableSections.find(s => s.id === sectionId);
              return (
                <div 
                  key={sectionId} 
                  className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                >
                  {section?.title}
                  <button
                    type="button"
                    onClick={() => handleRemoveFromSection(sectionId)}
                    className="ml-2 text-blue-600 hover:text-blue-900"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}