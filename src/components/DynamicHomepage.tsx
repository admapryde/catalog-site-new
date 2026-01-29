'use client';

import { useState, useEffect, useRef } from 'react';
import { HomepageStructure, getHomepageStructure } from '@/services/homepage-structure-service';
import CategoriesGrid from '@/components/CategoriesGrid';
import BannerSlider from '@/components/BannerSlider';
import HomepageSections from '@/components/HomepageSections';
import { BannerGroup as BaseBannerGroup, Banner } from '@/types';
import { fetchCategoriesForClient, fetchBannersForClient, fetchHomepageSectionsForClient } from '@/utils/homepage-client-utils';

interface BlockComponentProps {
  settings: Record<string, any>;
}

// Компонент для блока сетки категорий
const CategoriesGridBlock = ({ settings }: BlockComponentProps) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        // Используем клиентскую утилиту для получения категорий
        const module = await import('@/utils/homepage-client-utils');
        const data = await module.fetchCategoriesForClient();
        setCategories(data.categories || []);
      } catch (error) {
        console.error('Ошибка загрузки категорий:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Используем заголовок из настроек блока, а не из данных категорий
  const title = settings.title || 'Категории';

  if (loading) {
    return (
      <div className="py-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/4 mx-auto"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {[...Array(8)].map((_, idx) => (
                <div key={idx} className="aspect-square bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <CategoriesGrid
      categories={categories}
      title={title}
      maxDisplayCount={settings.max_display_count || 16}
      showImages={settings.show_images !== undefined ? settings.show_images : true}
      columns={settings.columns || 8}
    />
  );
};

// Расширенный тип для группы баннеров с вложенными баннерами
interface BannerGroupWithBanners extends BaseBannerGroup {
  banners: Banner[];
}

// Компонент для блока слайдера баннеров
const BannerSliderBlock = ({ settings }: BlockComponentProps) => {
  const [allBannerGroups, setAllBannerGroups] = useState<BannerGroupWithBanners[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoading(true);
        // Используем клиентскую утилиту для получения баннеров
        const module = await import('@/utils/homepage-client-utils');
        const data = await module.fetchBannersForClient();
        setAllBannerGroups(data);
      } catch (error) {
        console.error('Ошибка загрузки баннеров:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  if (loading) {
    return (
      <div className="py-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/4 mx-auto"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Фильтруем группы баннеров на основе настроек блока
  const selectedGroupIds = settings.selected_group_ids || [];
  const filteredBannerGroups = selectedGroupIds.length > 0
    ? allBannerGroups.filter(group => selectedGroupIds.includes(group.id))
    : allBannerGroups; // Если не выбраны конкретные группы, отображаем все

  return (
    <div className="py-8">
      {filteredBannerGroups?.map((group) => (
        <BannerSlider
          key={group.id}
          group={{
            id: group.id,
            title: group.title,
            position: group.position,
            banners: group.banners
          }}
          autoRotate={settings.auto_rotate !== undefined ? settings.auto_rotate : true}
          rotationInterval={settings.rotation_interval || 5000}
          showIndicators={settings.show_indicators !== undefined ? settings.show_indicators : true}
          showNavigation={settings.show_navigation !== undefined ? settings.show_navigation : true}
        />
      ))}
    </div>
  );
};

// Компонент для блока разделов главной страницы
const HomepageSectionsBlock = ({ settings }: BlockComponentProps) => {
  const [allHomepageSections, setAllHomepageSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomepageSections = async () => {
      try {
        setLoading(true);
        // Используем клиентскую утилиту для получения разделов главной страницы
        const module = await import('@/utils/homepage-client-utils');
        const data = await module.fetchHomepageSectionsForClient();
        setAllHomepageSections(data);
      } catch (error) {
        console.error('Ошибка загрузки разделов главной страницы:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomepageSections();
  }, []);

  if (loading) {
    return (
      <div className="py-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/4 mx-auto"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Фильтруем разделы на основе настроек блока
  const selectedSectionIds = settings.selected_section_ids || [];
  const filteredSections = selectedSectionIds.length > 0
    ? allHomepageSections.filter(section => selectedSectionIds.includes(section.id))
    : allHomepageSections; // Если не выбраны конкретные разделы, отображаем все

  return (
    <HomepageSections
      sections={filteredSections || []}
      displayStyle={settings.display_style || 'grid'}
      columns={settings.columns || 4}
      showPrices={settings.show_prices !== undefined ? settings.show_prices : true}
      showDescriptions={settings.show_descriptions || false}
    />
  );
};

// Компонент для безопасного отображения HTML-контента
const SafeHtmlContent = ({ htmlContent }: { htmlContent: string }) => {
  const htmlRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (htmlRef.current && htmlContent) {
      htmlRef.current.innerHTML = htmlContent;
    }
  }, [htmlContent]);

  return <div ref={htmlRef} className="prose max-w-none mb-6 text-gray-900" />;
};

// Компонент для блока пользовательского контента
const CustomContentBlock = ({ settings }: BlockComponentProps) => {
  const title = settings.title || '';
  const text = settings.text || '';
  const imageUrl = settings.image_url || null;

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        {title && <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">{title}</h2>}
        {text && <SafeHtmlContent htmlContent={text} />}
        {imageUrl && (
          <div className="flex justify-center">
            <img
              src={imageUrl}
              alt="Пользовательское изображение"
              className="max-w-full h-auto rounded-lg shadow-md"
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Карта типов блоков к компонентам
const BLOCK_COMPONENTS: Record<string, React.ComponentType<BlockComponentProps>> = {
  'categories_grid': CategoriesGridBlock,
  'banner_slider': BannerSliderBlock,
  'homepage_sections': HomepageSectionsBlock,
  'custom_content': CustomContentBlock,
};

const DynamicHomepage = () => {
  const [homepageStructure, setHomepageStructure] = useState<HomepageStructure | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHomepageStructure = async () => {
      try {
        setLoading(true);
        const structure = await getHomepageStructure();
        setHomepageStructure(structure);
      } catch (err) {
        console.error('Ошибка загрузки структуры главной страницы:', err);
        setError('Ошибка загрузки содержимого главной страницы');
      } finally {
        setLoading(false);
      }
    };

    loadHomepageStructure();
  }, []);

  if (loading) {
    return (
      <div className="py-4 pt-12 md:pt-4">
        <div className="container mx-auto px-2">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/4 mx-auto"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {[...Array(8)].map((_, idx) => (
                <div key={idx} className="aspect-square bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !homepageStructure) {
    return (
      <div className="py-4 pt-12 md:pt-4">
        <div className="container mx-auto px-2">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Ошибка! </strong>
            <span className="block sm:inline">{error || 'Не удалось загрузить содержимое главной страницы.'}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 pt-12 md:pt-4">
      <div className="container mx-auto px-2">
        {homepageStructure.blocks.map((block) => {
          // Проверяем, включен ли блок и должен ли он отображаться
          if (!block.enabled || !block.visible) {
            return null;
          }

          // Получаем компонент для типа блока
          const BlockComponent = BLOCK_COMPONENTS[block.type];
          
          if (!BlockComponent) {
            console.warn(`Неизвестный тип блока: ${block.type}`);
            return null;
          }

          return (
            <div key={block.id} className="grey-background-container">
              <BlockComponent settings={block.settings} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DynamicHomepage;