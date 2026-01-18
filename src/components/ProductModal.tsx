'use client';

import { useEffect, useRef } from 'react';
import { ProductDetail } from '@/types';
import OptimizedImage from '@/components/OptimizedImage';

interface ProductModalProps {
  product: ProductDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductModal({ product, isOpen, onClose }: ProductModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
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
  }, [isOpen, onClose]);

  // Handle Escape key press
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const mainImage = product.images && Array.isArray(product.images)
    ? (product.images.find((img) => img.is_main) || product.images[0])
    : null;

  const thumbnailImages = product.images && Array.isArray(product.images)
    ? product.images.filter((img) => !img.is_main)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center">
      {/* Overlay - создает эффект затемнения фона */}
      <div
        className="fixed inset-0"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.25)' }}
        onClick={onClose}
      ></div>

      {/* Модальное окно */}
      <div
        ref={modalRef}
        className="relative z-50 w-full max-w-6xl bg-white rounded-lg shadow-2xl flex flex-col max-h-screen mt-16"
      >
        {/* Close button - similar to banner arrows */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-300 hover:bg-gray-100 transition-all shadow-md"
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

        <div className="overflow-y-auto flex-grow p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Left column (media) */}
            <div>
              <div className="mb-4">
                <OptimizedImage
                  src={mainImage ? mainImage.image_url : '/placeholder-product.jpg'}
                  alt={product.name}
                  width={600}
                  height={600}
                  className="w-full h-auto rounded-lg object-cover"
                />
              </div>

              {thumbnailImages.length > 0 && (
                <div className="flex space-x-4 overflow-x-auto pb-2">
                  {thumbnailImages.map((image) => (
                    <div key={image.id} className="flex-shrink-0">
                      <OptimizedImage
                        src={image.image_url}
                        alt={`Thumbnail ${image.id}`}
                        width={80}
                        height={80}
                        className="w-20 h-20 object-cover rounded cursor-pointer border-2 border-transparent hover:border-blue-500"
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
                <button className="border border-gray-300 hover:border-gray-400 text-gray-700 font-medium py-3 px-6 rounded-lg transition">
                  В избранное
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}