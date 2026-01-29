'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import OptimizedImage from '@/components/OptimizedImage';
import { Product } from '@/types';
import styles from '@/components/homepage-sections.module.css';
import ProductModal from '@/components/ProductModal';
import ProductTitle from '@/components/ProductTitle';

interface HomepageSection {
  id: string;
  title: string;
  position: number;
  items: Array<{
    id: string;
    section_id: string;
    product_id: string;
    sort_order: number;
    product: Product;
  }>;
}

interface ExtendedHomepageSectionsProps {
  sections: HomepageSection[];
  displayStyle?: 'grid' | 'list' | 'carousel';
  columns?: number;
  showPrices?: boolean;
  showDescriptions?: boolean;
}

export default function HomepageSections({
  sections,
  displayStyle = 'grid',
  columns = 4,
  showPrices = true,
  showDescriptions = false
}: ExtendedHomepageSectionsProps) {
  const [loading, setLoading] = useState(true);
  const [localSections, setLocalSections] = useState<HomepageSection[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null); // Using any temporarily since we need to fetch full product details
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Используем переданные разделы
    setLocalSections(sections);
    setLoading(false);
  }, [sections]);

  const handleProductClick = async (productId: string) => {
    try {
      // Fetch full product details for the modal
      const response = await fetch(`/api/products/${productId}`);

      if (!response.ok) {
        throw new Error(`Ошибка загрузки деталей товара: ${response.status} ${response.statusText}`);
      }

      const productDetail = await response.json();
      setSelectedProduct(productDetail);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Ошибка загрузки деталей товара:', error);
      // Fallback to navigation if API fails
      window.location.href = `/product/${productId}`;
    }
  };

  if (loading || !sections || sections.length === 0) {
    return null;
  }

  return (
    <>
      {localSections.map((section, index) => {
        if (!section.items || section.items.length === 0) {
          return null;
        }

        // Определяем класс фона в зависимости от четности индекса
        const backgroundColorClass = index % 2 === 0 ? '' : styles.homepageSectionsSectionAlt;

        return (
          <section key={section.id} className={`${styles.homepageSectionsSection} ${backgroundColorClass}`}>
            <div className={styles.homepageSectionsContainer}>
              <h2 className={styles.homepageSectionTitle}>{section.title}</h2>
              <div
                className={styles.homepageSectionsGrid}
              >
                {section.items.map((item) => {
                  const product = item.product;
                  const mainImage = product.images && Array.isArray(product.images)
                    ? (product.images.find(img => img.is_main) || product.images[0])
                    : null;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleProductClick(product.id)}
                      className="block group bg-white/85 rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
                    >
                      <div className="relative pb-[100%]"> {/* Квадратный аспект, как на странице каталога */}
                        {mainImage ? (
                          <OptimizedImage
                            src={mainImage.image_url}
                            alt={product.name}
                            fill
                            className="absolute h-full w-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              // Проверяем, не является ли уже изображением-заглушкой, чтобы избежать бесконечного цикла
                              if (!target.src.includes('placeholder-product.jpg')) {
                                target.src = '/placeholder-product.jpg';
                              }
                            }}
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                            loading="lazy"
                          />
                        ) : (
                          <div className="absolute h-full w-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500">Нет изображения</span>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <ProductTitle
                          title={product.name}
                          className={`${styles.homepageSectionCardTitle} text-left`}
                        />
                        {showPrices && (
                          <>
                            <p className="text-xs text-gray-500 mb-1">Цена</p>
                            <p className="text-xl font-bold text-gray-900">{product.price?.toLocaleString('ru-RU')} ₽</p>
                          </>
                        )}
                        {showDescriptions && product.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{product.description}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        );
      })}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}