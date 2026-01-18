'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import OptimizedImage from '@/components/OptimizedImage';
import styles from '@/components/banner-slider.module.css';

interface Banner {
  id: string;
  group_id: string;
  image_url: string;
  link_url: string;
  sort_order: number;
}

interface BannerGroup {
  id: string;
  title: string;
  position: number;
  banners: Banner[];
}

export default function BannerSlider({ group }: { group: BannerGroup }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Автоматическая прокрутка каждые 5 секунд
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === group.banners.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [group.banners.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? group.banners.length - 1 : currentIndex - 1);
  };

  const goToNext = () => {
    setCurrentIndex(currentIndex === group.banners.length - 1 ? 0 : currentIndex + 1);
  };

  if (group.banners.length === 0) {
    return null;
  }

  return (
    <section className={styles.bannerSliderSection}>
      <div className={styles.bannerSliderContainer}>
        <h2 className={styles.bannerSliderTitle}>{group.title}</h2>
        <div className={`${styles.bannerSliderWrapper} group`}>
          {/* Адаптивная высота контейнера баннера в зависимости от соотношения сторон */}
          <div className={`${styles.bannerSliderGroup} ${styles.bannerSliderMaxHeight}`}>
            {group.banners.map((banner, index) => (
              <Link
                href={banner.link_url || '#'}
                key={banner.id}
                className={`${styles.bannerSliderSlide} ${index === currentIndex ? styles.bannerSliderSlideActive : ''}`}
              >
                <div className={styles.bannerSliderImageWrapper}>
                  <OptimizedImage
                    src={banner.image_url}
                    alt={`Баннер ${index + 1} - ${group.title}`}
                    fill
                    className={styles.bannerSliderImage}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      // Проверяем, не является ли уже изображением-заглушкой, чтобы избежать бесконечного цикла
                      if (!target.src.includes('placeholder-banner.jpg')) {
                        target.src = '/placeholder-banner.jpg';
                      }
                    }}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
                    loading="lazy"
                  />
                </div>
              </Link>
            ))}
          </div>

          {/* Навигационные стрелки */}
          <button
            onClick={goToPrevious}
            className={styles.bannerSliderPrevButton}
            aria-label="Предыдущий баннер"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={goToNext}
            className={styles.bannerSliderNextButton}
            aria-label="Следующий баннер"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Индикаторы */}
          <div className={styles.bannerSliderIndicators}>
            {group.banners.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`${styles.bannerSliderIndicator} ${index === currentIndex ? styles.bannerSliderIndicatorActive : ''}`}
                aria-label={`Перейти к баннеру ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}