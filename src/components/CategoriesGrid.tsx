'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import OptimizedImage from '@/components/OptimizedImage';
import styles from '@/components/categories-grid.module.css';

interface Category {
  id: string;
  name: string;
  image_url: string;
  sort_order: number;
}

export default function CategoriesGrid({ categories }: { categories: Category[] }) {
  const [loading, setLoading] = useState(true);
  const [localCategories, setLocalCategories] = useState<Category[]>([]);

  useEffect(() => {
    // Используем переданные категории
    setLocalCategories(categories);
    setLoading(false);
  }, [categories]);

  if (loading || !categories || categories.length === 0) {
    return (
      <div className={styles.categoriesGridSkeleton}>
        <div className={styles.categoriesGridContainer}>
          {[...Array(16)].map((_, index) => (
            <div key={index} className={styles.categoriesGridSkeletonItem}></div>
          ))}
        </div>
      </div>
    );
  }

  // Сортировка по порядку
  const sortedCategories = [...localCategories].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <section className={styles.categoriesGridSection}>
      <div className={styles.categoriesGridContainer}>
        <h2 className={`${styles.categoriesGridTitle} text-center`}>Категории</h2>
        <div className={styles.categoriesGridGrid}>
          {sortedCategories.slice(0, 16).map((category) => (
            <Link
              href={`/catalog/${category.id}`}
              key={category.id}
              className={styles.categoriesGridItem}
            >
              <div className={styles.categoriesGridItemImageWrapper}>
                <OptimizedImage
                  src={category.image_url}
                  alt={category.name}
                  fill
                  className={styles.categoriesGridItemImage}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    // Проверяем, не является ли уже изображением-заглушкой, чтобы избежать бесконечного цикла
                    if (!target.src.includes('placeholder-category.jpg')) {
                      target.src = '/placeholder-category.jpg';
                    }
                  }}
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                  loading="lazy"
                />
              </div>
              <div className={styles.categoriesGridItemContent}>
                <h3 className={`${styles.categoriesGridItemTitle} text-center`}>{category.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}