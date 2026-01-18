'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Логируем ошибку в консоль разработчика
    console.error('Глобальная ошибка приложения:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="py-8">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Произошла критическая ошибка</h2>
            <p className="text-gray-600 mb-6">Код ошибки: {error.digest || 'Неизвестен'}</p>
            <button
              onClick={() => reset()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Перезагрузить приложение
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}