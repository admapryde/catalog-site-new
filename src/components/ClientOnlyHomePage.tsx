'use client';

import { useState, useEffect } from 'react';
import HomePageContent from './HomePageContent';

interface HomePageContentProps {
  initialUseDynamicHomepage: boolean;
  initialCategories?: any[];
  initialCategoriesTitle?: string;
  initialBannerGroups?: any[];
  initialHomepageSections?: any[];
}

export default function ClientOnlyHomePage(props: HomePageContentProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Показываем плейсхолдер на сервере и до монтирования на клиенте
  if (!isMounted) {
    // Возвращаем ту же структуру, что и HomePageContent, чтобы избежать гидрации
    return (
      <div className="py-4 pt-12 md:pt-4">
        <div className="container mx-auto px-2">
          <div className="grey-background-container">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/4 mx-auto"></div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                {[...Array(8)].map((_, idx) => (
                  <div key={idx} className="aspect-square bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>

          <div className="grey-background-container">
            <div className="py-4 animate-pulse">
              <div className="h-64 bg-gray-200 rounded w-full"></div>
            </div>
          </div>

          <div className="grey-background-container">
            <div className="animate-pulse space-y-8">
              {[...Array(2)].map((_, idx) => (
                <div key={idx}>
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, idx) => (
                      <div key={idx} className="border rounded p-4">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <HomePageContent {...props} />;
}