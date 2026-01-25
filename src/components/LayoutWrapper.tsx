'use client';

import { ReactNode, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Динамический импорт компонентов Footer для избежания проблем с гидрацией
const Footer = dynamic(() => import('@/components/FooterWrapper'), {
  ssr: false,
  loading: () => (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="animate-pulse">
            <h3 className="text-lg font-semibold mb-4 text-left h-6 bg-gray-600 rounded"></h3>
            <p className="text-gray-300 h-4 bg-gray-600 rounded mb-2"></p>
            <p className="text-gray-300 h-4 bg-gray-600 rounded w-3/4"></p>
          </div>
          <div className="animate-pulse">
            <h3 className="text-lg font-semibold mb-4 text-left h-6 bg-gray-600 rounded"></h3>
            <ul className="space-y-2 text-gray-300">
              <li className="h-4 bg-gray-600 rounded"></li>
              <li className="h-4 bg-gray-600 rounded"></li>
              <li className="h-4 bg-gray-600 rounded w-4/5"></li>
            </ul>
          </div>
          <div className="animate-pulse">
            <h3 className="text-lg font-semibold mb-4 text-left h-6 bg-gray-600 rounded"></h3>
            <ul className="space-y-2">
              <li className="h-4 bg-gray-600 rounded"></li>
              <li className="h-4 bg-gray-600 rounded"></li>
              <li className="h-4 bg-gray-600 rounded w-3/4"></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-400">
          <p className="h-4 bg-gray-600 rounded w-1/2 mx-auto"></p>
        </div>
      </div>
    </footer>
  )
});

// Импортируем HeaderWrapper как обычный компонент
import HeaderWrapper from '@/components/HeaderWrapper';
import MobileBottomNav from '@/components/MobileBottomNav';

export default function LayoutWrapper({ children }: { children: ReactNode }) {
  // Для согласованности между сервером и клиентом не используем состояние монтирования
  // поскольку дочерние компоненты сами обрабатывают гидратацию
  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-16 md:pb-0">
      <HeaderWrapper />
      <main className="flex-grow bg-gray-100">
        {children}
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}