'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ProductDetail } from '@/types';
import OptimizedImage from '@/components/OptimizedImage';
import ShareButton from '@/components/ShareButton';

interface ProductModalProps {
  product: ProductDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductModal({ product, isOpen, onClose }: ProductModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [enlargedImageOpen, setEnlargedImageOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isEnlargedImageClosing, setIsEnlargedImageClosing] = useState(false);

  // Function to handle closing with animation
  const handleClose = () => {
    setIsClosing(true);
    // Wait for animation to complete before actually closing
    setTimeout(() => {
      setIsClosing(false);
      onClose();
      setEnlargedImageOpen(false);
    }, 100); // Match the animation duration
  };

  // Function to handle closing enlarged image with animation
  const handleCloseEnlargedImage = () => {
    setIsEnlargedImageClosing(true);
    // Wait for animation to complete before actually closing
    setTimeout(() => {
      setIsEnlargedImageClosing(false);
      setEnlargedImageOpen(false);
    }, 100); // Match the animation duration
  };

  // Reset enlarged image state and current image index when modal opens
  useEffect(() => {
    if (isOpen) {
      setEnlargedImageOpen(false);
      // Reset to main image (index 0) when modal opens
      setCurrentImageIndex(0);
    }
  }, [isOpen]);

  // Close modal when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only close the modal if the enlarged image is not open
      if (!enlargedImageOpen && modalRef.current && !modalRef.current.contains(event.target as Node)) {
        handleClose();
        // Also reset enlarged image state when closing modal
        setEnlargedImageOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Add a class to body to handle backdrop styling
      document.body.classList.add('modal-open');
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.classList.remove('modal-open');
    };
  }, [isOpen, onClose, enlargedImageOpen]);

  // Handle Escape key press
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // If enlarged image is open, close only the enlarged image
        if (enlargedImageOpen) {
          setEnlargedImageOpen(false);
        } else {
          handleClose();
          // Also reset enlarged image state when closing modal
          setEnlargedImageOpen(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose, enlargedImageOpen]);

  if (!isOpen || !product) return null;

  // Объединяем все изображения, сначала главное изображение
  const allImages = product.images && Array.isArray(product.images)
    ? [...product.images.filter(img => img.is_main), ...product.images.filter(img => !img.is_main)]
    : [];

  // Если нет главного изображения, берем первое изображение как главное
  if (allImages.length > 0 && !allImages.some(img => img.is_main)) {
    allImages.unshift(allImages[0]);
  }

  const currentImage = allImages[currentImageIndex] || null;

  // Все изображения, кроме текущего, используются как миниатюры
  const thumbnailImages = allImages.filter((_, index) => index !== currentImageIndex);

  return typeof document !== 'undefined' ? createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4">
      {/* Overlay - создает эффект затемнения фона */}
      <div
        className="fixed inset-0"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.25)' }}
        onClick={() => {
          if (!enlargedImageOpen) {
            handleClose();
          }
        }}
      ></div>

      {/* Модальное окно */}
      <div
        ref={modalRef}
        className={`relative z-[100] w-full bg-white flex flex-col h-full max-h-screen md:max-h-[calc(100vh-2rem)] transition-opacity duration-150 ${
          isClosing ? 'animate-modal-scale-out' : (isOpen ? 'opacity-100 animate-modal-scale-fast' : 'opacity-0')
        } md:max-w-6xl md:rounded-lg md:shadow-2xl`}
      >
        <div className="overflow-hidden flex-grow">
          <div className="overflow-y-auto relative h-full max-h-screen p-4 md:p-8 md:max-h-[calc(100vh-8rem)]">
            {/* Close button - stays fixed at top right corner */}
            <button
              onClick={() => {
                // If enlarged image is open, close only the enlarged image
                if (enlargedImageOpen) {
                  setEnlargedImageOpen(false);
                } else {
                  handleClose();
                  setEnlargedImageOpen(false);
                }
              }}
              className="fixed top-2 right-2 z-[101] flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white border border-gray-300 hover:bg-gray-100 transition-all shadow-md md:absolute md:top-2 md:right-2"
              aria-label="Закрыть"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-10 pb-20 md:gap-12 md:pt-10 md:pr-10 md:pb-0 md:pl-0">
              {/* Left column (media) */}
              <div className="relative">
                <div className="mb-4 relative">
                  <OptimizedImage
                    src={currentImage ? currentImage.image_url : '/placeholder-product.jpg'}
                    alt={product.name}
                    width={600}
                    height={600}
                    className="w-full h-auto rounded-lg object-cover"
                  />

                  {/* Кнопка "расширить" в правом нижнем углу */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setEnlargedImageOpen(true); }}
                    className="absolute bottom-2 right-2 z-20 flex items-center justify-center w-8 h-8 rounded-full bg-white/70 hover:bg-white/90 transition-all shadow-md"
                    aria-label="Расширить изображение"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-gray-800"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m4 0l-5-5" />
                    </svg>
                  </button>

                  {/* Стрелка "назад" */}
                  {allImages.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prevIndex) =>
                        prevIndex === 0 ? allImages.length - 1 : prevIndex - 1
                      );}}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white/70 hover:bg-white/90 transition-all shadow-md"
                      aria-label="Предыдущее изображение"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-gray-800"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}

                  {/* Стрелка "вперед" */}
                  {allImages.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prevIndex) =>
                        prevIndex === allImages.length - 1 ? 0 : prevIndex + 1
                      );}}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white/70 hover:bg-white/90 transition-all shadow-md"
                      aria-label="Следующее изображение"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-gray-800"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>

                {allImages.length > 1 && (
                  <div className="flex space-x-4 overflow-x-auto pb-2">
                    {allImages.map((image, index) => (
                      <div
                        key={image.id}
                        className="flex-shrink-0 cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(index); }}
                      >
                        <OptimizedImage
                          src={image.image_url}
                          alt={`Thumbnail ${image.id}`}
                          width={80}
                          height={80}
                          className={`w-20 h-20 object-cover rounded ${
                            index === currentImageIndex ? 'border-2 border-blue-500' : 'border-2 border-transparent hover:border-blue-500'
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right column (information) */}
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-4">{product.name}</h1>

                <div className="mb-6">
                  <p className="text-3xl font-bold text-gray-900">{product.price.toLocaleString('ru-RU')} ₽</p>
                </div>

                {product.description && (
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Описание</h2>
                    <div className="prose max-w-none text-gray-700">
                      {product.description}
                    </div>
                  </div>
                )}

                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Характеристики</h2>
                  <div className="grid grid-cols-1 gap-3">
                    {product.specs.map((spec) => (
                      <div key={spec.id} className="flex border-b border-gray-100 py-2">
                        <span className="text-gray-600">{spec.property_name}:</span>
                        <span className="font-medium text-gray-800 ml-2">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-4">
                  <ShareButton
                    productName={product.name}
                    productUrl={`/product/${product.id}`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Рендерим увеличенное изображение через портал, чтобы избежать проблем с всплытием событий */}
      {typeof document !== 'undefined' && enlargedImageOpen && currentImage &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90"
            onClick={() => handleCloseEnlargedImage()}
          >
            <div
              className={`relative max-w-6xl max-h-[90vh] ${
                isEnlargedImageClosing ? 'animate-modal-scale-out' : (enlargedImageOpen ? 'animate-modal-scale-fast' : '')
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Кнопка закрытия увеличенного изображения */}
              <button
                onClick={(e) => { e.stopPropagation(); handleCloseEnlargedImage(); }}
                className="absolute top-2 right-2 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white/70 hover:bg-white/90 transition-all shadow-md"
                aria-label="Закрыть"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Увеличенное изображение */}
              <OptimizedImage
                src={currentImage.image_url}
                alt={product.name}
                width={1200}
                height={1200}
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
              />

              {/* Стрелка "назад" для увеличенного изображения */}
              {allImages.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prevIndex) =>
                    prevIndex === 0 ? allImages.length - 1 : prevIndex - 1
                  );}}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white/70 hover:bg-white/90 transition-all shadow-md"
                  aria-label="Предыдущее изображение"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-gray-800"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}

              {/* Стрелка "вперед" для увеличенного изображения */}
              {allImages.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prevIndex) =>
                    prevIndex === allImages.length - 1 ? 0 : prevIndex + 1
                  );}}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white/70 hover:bg-white/90 transition-all shadow-md"
                  aria-label="Следующее изображение"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-gray-800"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>,
          document.body
        )
      }
    </div>,
    document.body
  ) : null;
}