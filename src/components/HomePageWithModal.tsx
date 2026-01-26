'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductModal from '@/components/ProductModal';

interface HomePageWithModalProps {
  children: React.ReactNode;
}

export default function HomePageWithModal({ children }: HomePageWithModalProps) {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const openModalParam = searchParams?.get('openModal');
    if (openModalParam) {
      // Загружаем данные продукта по ID из параметра
      const fetchProduct = async () => {
        try {
          const response = await fetch(`/api/products/${openModalParam}`);
          
          if (!response.ok) {
            throw new Error(`Ошибка загрузки деталей товара: ${response.status} ${response.statusText}`);
          }

          const productDetail = await response.json();
          setSelectedProduct(productDetail);
          setIsModalOpen(true);
        } catch (error) {
          console.error('Ошибка загрузки деталей товара:', error);
        }
      };

      fetchProduct();
    }
  }, [searchParams]);

  return (
    <>
      {children}
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