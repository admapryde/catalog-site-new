'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Логируем ошибку в консоль разработчика
    console.error('Ошибка приложения:', error);
  }, [error]);

  return (
    <div className="py-8">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Произошла ошибка</h2>
        <p className="text-gray-600 mb-6">Код ошибки: {error.digest || 'Неизвестен'}</p>
        <button
          onClick={() => reset()}
          className="mr-4 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Попробовать снова
        </button>
        <button
          onClick={() => router.push('/')}
          className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Вернуться на главную
        </button>
      </div>
    </div>
  );
}