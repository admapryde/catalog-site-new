'use client';

import { useState, useEffect } from 'react';
import { HomepageStructure, getHomepageStructure } from '@/services/homepage-structure-service';
import HomepageBlocksManager from '@/components/admin/HomepageBlocksManager';
import { useNotification } from '@/hooks/useNotification';

export default function HomepageEditor() {
  const [homepageStructure, setHomepageStructure] = useState<HomepageStructure | null>(null);
  const [loading, setLoading] = useState(true);

  const { showNotification, renderNotification } = useNotification();

  // Загрузка структуры главной страницы
  useEffect(() => {
    const fetchHomepageStructure = async () => {
      try {
        const structure = await getHomepageStructure();
        setHomepageStructure(structure);
      } catch (error) {
        console.error('Ошибка загрузки структуры главной страницы:', error);
        showNotification('Ошибка загрузки структуры главной страницы', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchHomepageStructure();
  }, []);

  const handleBlockChange = () => {
    // Обновляем структуру при изменении блока
    const fetchHomepageStructure = async () => {
      try {
        const structure = await getHomepageStructure();
        setHomepageStructure(structure);
      } catch (error) {
        console.error('Ошибка обновления структуры главной страницы:', error);
      }
    };

    fetchHomepageStructure();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {renderNotification()}

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Редактор главной страницы</h1>
        <p className="text-gray-600">
          Управление блоками главной страницы
        </p>
      </div>

      <HomepageBlocksManager onBlockChange={handleBlockChange} />

      {/* Информация о текущей структуре */}
      <div className="mt-8 bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-800 mb-2">Текущая структура</h3>
        <div className="text-sm text-gray-600">
          <p>Количество блоков: {homepageStructure?.blocks.length || 0}</p>
          <div className="mt-2">
            <p className="font-medium">Блоки по порядку:</p>
            <ul className="list-disc pl-5 mt-1">
              {homepageStructure?.blocks
                .sort((a, b) => a.position - b.position)
                .map(block => (
                  <li key={block.id} className="capitalize">
                    {block.position}. {block.type.replace('_', ' ')} - {block.visible ? 'видимый' : 'скрыт'}, {block.enabled ? 'включен' : 'выключен'}
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}