'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Динамический импорт компонентов для избежания проблем с гидрацией
const CategoriesGrid = dynamic(() => import('@/components/CategoriesGrid'), {
  ssr: false,
  loading: () => (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded w-1/4 mx-auto"></div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {[...Array(8)].map((_, idx) => (
          <div key={idx} className="aspect-square bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
  )
});

const BannerSlider = dynamic(() => import('@/components/BannerSlider'), {
  ssr: true,
  loading: () => (
    <div className="py-4 animate-pulse">
      <div className="h-64 bg-gray-200 rounded w-full"></div>
    </div>
  )
});

const HomepageSections = dynamic(() => import('@/components/HomepageSections'), {
  ssr: false,
  loading: () => (
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
  )
});

const DynamicHomepage = dynamic(() => import('@/components/DynamicHomepage'), {
  ssr: false,
  loading: () => (
    <div className="animate-pulse space-y-8">
      <div className="h-8 bg-gray-200 rounded w-1/4 mx-auto"></div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {[...Array(8)].map((_, idx) => (
          <div key={idx} className="aspect-square bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
  )
});

interface HomePageContentProps {
  initialUseDynamicHomepage: boolean;
  initialCategories?: any[];
  initialCategoriesTitle?: string;
  initialBannerGroups?: any[];
  initialHomepageSections?: any[];
}

export default function HomePageContent({
  initialUseDynamicHomepage,
  initialCategories = [],
  initialCategoriesTitle = 'Категории',
  initialBannerGroups = [],
  initialHomepageSections = []
}: HomePageContentProps) {
  if (initialUseDynamicHomepage) {
    return <DynamicHomepage />;
  } else {
    return (
      <div className="py-4 pt-12 md:pt-4">
        <div className="container mx-auto px-2">
          {/* Сетка категорий */}
          <div className="grey-background-container">
            <CategoriesGrid categories={initialCategories} title={initialCategoriesTitle} />
          </div>

          {/* Блоки баннеров */}
          {initialBannerGroups?.map((group: any) => (
            <div key={group.id} className="grey-background-container">
              <BannerSlider group={{
                id: group.id,
                title: group.title,
                position: group.position,
                banners: group.banners || []
              }} />
            </div>
          ))}

          {/* Разделы ГС */}
          <div className="grey-background-container">
            <HomepageSections sections={initialHomepageSections || []} />
          </div>
        </div>
      </div>
    );
  }
}