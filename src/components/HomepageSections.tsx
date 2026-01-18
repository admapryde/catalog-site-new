'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import OptimizedImage from '@/components/OptimizedImage';
import { Product } from '@/types';
import styles from '@/components/homepage-sections.module.css';

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

export default function HomepageSections({ sections }: { sections: HomepageSection[] }) {
  const [loading, setLoading] = useState(true);
  const [localSections, setLocalSections] = useState<HomepageSection[]>([]);

  useEffect(() => {
    // Используем переданные разделы
    setLocalSections(sections);
    setLoading(false);
  }, [sections]);

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
              <h2 className={styles.homepageSectionCardTitle}>{section.title}</h2>
              <div className={styles.homepageSectionsGrid}>
                {section.items.map((item) => {
                  const product = item.product;
                  const mainImage = product.images && Array.isArray(product.images)
                    ? (product.images.find(img => img.is_main) || product.images[0])
                    : null;

                  return (
                    <Link
                      href={`/product/${product.id}`}
                      key={item.id}
                      className={styles.homepageSectionCard}
                    >
                      <div className={styles.homepageSectionImageWrapper}>
                        {mainImage ? (
                          <OptimizedImage
                            src={mainImage.image_url}
                            alt={product.name}
                            fill
                            className={styles.homepageSectionImage}
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
                      <div className={styles.homepageSectionContent}>
                        <h3 className={styles.homepageSectionCardTitle}>{product.name}</h3>
                        <p className="text-lg font-bold text-gray-900">{product.price?.toLocaleString('ru-RU')} ₽</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        );
      })}
    </>
  );
}