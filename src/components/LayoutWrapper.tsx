'use client';

import { ReactNode } from 'react';
import dynamic from 'next/dynamic';

// Динамический импорт всего LayoutWrapper для избежания проблем с гидрацией
const DynamicLayoutWrapper = dynamic(() => import('./LayoutWrapperImpl'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="animate-pulse bg-gray-200 rounded w-32 h-8 my-4"></div>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-grow bg-white">
        <div className="animate-pulse bg-gray-200 rounded w-full h-64 my-4"></div>
        <div className="animate-pulse bg-gray-200 rounded w-3/4 h-4 my-2"></div>
        <div className="animate-pulse bg-gray-200 rounded w-1/2 h-4 my-2"></div>
      </main>
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse bg-gray-600 rounded w-1/2 h-4 mx-auto"></div>
        </div>
      </footer>
    </div>
  )
});

// Экспортируем обертку
export default function LayoutWrapper({ children }: { children: ReactNode }) {
  return <DynamicLayoutWrapper>{children}</DynamicLayoutWrapper>;
}