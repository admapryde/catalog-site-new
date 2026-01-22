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

export default function LayoutWrapper({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="bg-white shadow-md sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-10">
              <div className="text-xl font-bold text-gray-800">Каталог</div>
              <nav className="hidden md:flex space-x-6">
                <span className="text-gray-600">Главная</span>
                <span className="text-gray-600">Каталог</span>
                <span className="text-gray-600">О нас</span>
                <span className="text-gray-600">Контакты</span>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-full md:w-96 lg:w-[500px] xl:w-[600px] px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 animate-pulse">
                <div className="h-5 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-grow">{children}</main>
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
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <HeaderWrapper />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}