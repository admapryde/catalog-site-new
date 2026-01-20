'use client';

import { useState, useEffect } from 'react';
import Footer from '@/components/Footer';
import { FooterSettings } from '@/services/footer-service';

export default function FooterWrapper() {
  const [footerSettings, setFooterSettings] = useState<FooterSettings | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fetchFooterSettings = async () => {
      try {
        const response = await fetch('/api/footer-settings');
        if (response.ok) {
          const settings: FooterSettings = await response.json();
          setFooterSettings(settings);
        } else {
          // Если не удалось получить настройки, используем значения по умолчанию
          setFooterSettings({
            footer_catalog_title: 'Каталог',
            footer_catalog_desc: 'Универсальная платформа для создания каталогов продукции различных отраслей.',
            footer_contacts_title: 'Контакты',
            footer_quick_links_title: 'Быстрые ссылки',
            contacts: [
              { id: '1', value: '📧 info@catalog.example' },
              { id: '2', value: '📞 +7 (XXX) XXX-XX-XX' },
              { id: '3', value: '📍 Москва, ул. Примерная, д. 1' }
            ],
            quick_links: [
              { id: '1', label: 'Главная', url: '/' },
              { id: '2', label: 'Каталог', url: '/catalog' },
              { id: '3', label: 'О нас', url: '/about' },
              { id: '4', label: 'Контакты', url: '/contacts' }
            ]
          });
        }
      } catch (error) {
        console.error('Ошибка загрузки настроек футера:', error);
        // В случае ошибки используем значения по умолчанию
        setFooterSettings({
          footer_catalog_title: 'Каталог',
          footer_catalog_desc: 'Универсальная платформа для создания каталогов продукции различных отраслей.',
          footer_contacts_title: 'Контакты',
          footer_quick_links_title: 'Быстрые ссылки',
          contacts: [
            { id: '1', value: '📧 info@catalog.example' },
            { id: '2', value: '📞 +7 (XXX) XXX-XX-XX' },
            { id: '3', value: '📍 Москва, ул. Примерная, д. 1' }
          ],
          quick_links: [
            { id: '1', label: 'Главная', url: '/' },
            { id: '2', label: 'Каталог', url: '/catalog' },
            { id: '3', label: 'О нас', url: '/about' },
            { id: '4', label: 'Контакты', url: '/contacts' }
          ]
        });
      }
    };

    fetchFooterSettings();
  }, []);

  if (!mounted || !footerSettings) {
    // Показываем заглушку до тех пор, пока данные не загрузятся
    return (
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
    );
  }

  return <Footer settings={footerSettings} />;
}