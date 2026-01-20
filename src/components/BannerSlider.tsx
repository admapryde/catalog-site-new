'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import OptimizedImage from '@/components/OptimizedImage';
import ProductModal from '@/components/ProductModal';
import { ProductDetail } from '@/types';
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
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  // Функция для проверки, является ли URL ссылкой на товар
  const isProductUrl = (url: string): boolean => {
    // Проверяем, соответствует ли URL паттерну /product/{uuid}, /api/products/{uuid}, или полный URL с product или api/products
    const productUrlPattern = /(\/product\/|\/api\/products\/)[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return productUrlPattern.test(url);
  };

  // Функция для обработки клика по баннеру
  const handleBannerClick = async (banner: Banner) => {
    if (isProductUrl(banner.link_url)) {
      // Это ссылка на товар, открываем модальное окно
      try {
        // Извлекаем UUID из URL, находя последнюю часть после последнего '/'
        const urlParts = banner.link_url.split('/');
        let productId = '';

        // Ищем UUID среди частей URL (обычно это последняя часть)
        for (let i = urlParts.length - 1; i >= 0; i--) {
          const part = urlParts[i];
          // Проверяем, соответствует ли часть формату UUID
          if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(part)) {
            productId = part;
            break;
          }
        }

        if (!productId) {
          throw new Error('Не удалось извлечь ID продукта из URL');
        }

        // Загружаем данные продукта
        const response = await fetch(`/api/products/${productId}`);
        if (!response.ok) {
          throw new Error(`Ошибка загрузки деталей товара: ${response.status} ${response.statusText}`);
        }

        const productDetail: ProductDetail = await response.json();
        setSelectedProduct(productDetail);
        setIsModalOpen(true);
      } catch (error) {
        console.error('Ошибка загрузки деталей товара:', error);
        // Если не удалось загрузить данные, переходим по обычной ссылке
        window.location.href = banner.link_url;
      }
    } else {
      // Это обычная ссылка, переходим по ней
      window.location.href = banner.link_url;
    }
  };

  if (group.banners.length === 0) {
    return null;
  }

  return (
    <section className={styles.bannerSliderSection}>
      <div className={styles.bannerSliderContainer}>
        <h2 className={`${styles.bannerSliderTitle} text-center`}>{group.title}</h2>
        <div className={`${styles.bannerSliderWrapper} group`}>
          {/* Адаптивная высота контейнера баннера в зависимости от соотношения сторон */}
          <div className={`${styles.bannerSliderGroup} ${styles.bannerSliderMaxHeight}`}>
            {group.banners.map((banner, index) => (
              banner.link_url ? (
                <div
                  key={banner.id}
                  className={`${styles.bannerSliderSlide} ${index === currentIndex ? styles.bannerSliderSlideActive : ''}`}
                  onClick={() => handleBannerClick(banner)}
                  style={{ cursor: 'pointer' }}
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
                </div>
              ) : (
                <div
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
                </div>
              )
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

      {/* Модальное окно для просмотра товара из баннера */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </section>
  );
}