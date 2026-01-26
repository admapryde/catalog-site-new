'use client';

import { useEffect } from 'react';

export default function ProductPage({ params }: { params: { id: string } }) {
  const productId = params.id;

  useEffect(() => {
    // При загрузке страницы перенаправляем на главную с параметром для открытия модального окна
    const redirectUrl = `/?openModal=${productId}`;
    window.location.href = redirectUrl;
  }, [productId]);

  // Пока идет редирект, показываем заглушку
  return (
    <div className="flex justify-center items-center h-64">
      <p>Загрузка товара...</p>
    </div>
  );
}