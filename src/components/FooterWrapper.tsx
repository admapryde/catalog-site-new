'use client';

import { useState, useEffect } from 'react';
import Footer from '@/components/Footer';
import { FooterSettings } from '@/services/footer-service';
import { GeneralSettings } from '@/services/general-settings-service';

// Ключи для хранения настроек футера в localStorage
const FOOTER_SETTINGS_CACHE_KEY = 'footer_settings_cache';
const GENERAL_SETTINGS_CACHE_KEY = 'general_settings_cache';

export default function FooterWrapper() {
  const [footerSettings, setFooterSettings] = useState<FooterSettings | null>(null);
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Сначала пробуем получить настройки из localStorage
    const cachedFooterSettings = localStorage.getItem(FOOTER_SETTINGS_CACHE_KEY);
    const cachedGeneralSettings = localStorage.getItem(GENERAL_SETTINGS_CACHE_KEY);

    let hasCachedSettings = false;

    if (cachedFooterSettings && cachedGeneralSettings) {
      try {
        const parsedFooterSettings = JSON.parse(cachedFooterSettings);
        let parsedGeneralSettings = JSON.parse(cachedGeneralSettings);

        // Убедимся, что parsedGeneralSettings соответствует типу GeneralSettings
        parsedGeneralSettings = {
          id: parsedGeneralSettings.id || '',
          site_title: parsedGeneralSettings.site_title || 'Каталог',
          site_icon: parsedGeneralSettings.site_icon || '/favicon.png',
          site_footer_info: parsedGeneralSettings.site_footer_info || '© 2026 Каталог. Все права защищены.',
          bg_image: parsedGeneralSettings.bg_image || '',
          created_at: parsedGeneralSettings.created_at || new Date().toISOString(),
          updated_at: parsedGeneralSettings.updated_at || new Date().toISOString()
        };

        setFooterSettings(parsedFooterSettings);
        setGeneralSettings(parsedGeneralSettings);
        hasCachedSettings = true;
      } catch (e) {
        console.error('Ошибка парсинга кэшированных настроек футера:', e);
      }
    }

    const fetchSettings = async () => {
      try {
        // Получаем настройки футера с параметром времени для обхода кэша
        const timestamp = new Date().getTime();
        const footerResponse = await fetch(`/api/footer-settings?t=${timestamp}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });

        if (footerResponse.ok) {
          const settings: FooterSettings = await footerResponse.json();
          setFooterSettings(settings);

          // Кэшируем настройки в localStorage
          localStorage.setItem(FOOTER_SETTINGS_CACHE_KEY, JSON.stringify(settings));
        }
        // Если не удалось получить настройки, НЕ используем значения по умолчанию

        // Получаем общие настройки
        const generalResponse = await fetch(`/api/general-settings?t=${timestamp}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });

        if (generalResponse.ok) {
          const general: GeneralSettings = await generalResponse.json();
          setGeneralSettings(general);

          // Кэшируем настройки в localStorage
          localStorage.setItem(GENERAL_SETTINGS_CACHE_KEY, JSON.stringify(general));
        } else {
          // Если не удалось получить настройки через API, пробуем получить напрямую из сервиса
          try {
            const general = await import('@/services/general-settings-service')
              .then(mod => mod.getGeneralSettings());
            setGeneralSettings(general);

            // Кэшируем настройки в localStorage
            localStorage.setItem(GENERAL_SETTINGS_CACHE_KEY, JSON.stringify(general));
          } catch (error) {
            console.error('Ошибка получения настроек через сервис:', error);
          }
        }
        // Если не удалось получить общие настройки, НЕ используем значения по умолчанию
      } catch (error) {
        console.error('Ошибка загрузки настроек футера:', error);
        // В случае ошибки также не используем значения по умолчанию
      } finally {
        setIsLoading(false);
      }
    };

    // Если у нас есть кэшированные настройки, не показываем загрузку
    if (hasCachedSettings) {
      setIsLoading(false);
    }

    fetchSettings();

    // Добавляем прослушивание события обновления метаданных
    const handleUpdateMetadata = () => {
      fetchSettings();
    };

    window.addEventListener('update-metadata', handleUpdateMetadata);

    // Очищаем подписку при размонтировании
    return () => {
      window.removeEventListener('update-metadata', handleUpdateMetadata);
    };
  }, []);

  if (!mounted || (isLoading && !footerSettings && !generalSettings)) {
    // Показываем пустой футер до загрузки данных
    return (
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 opacity-0 pointer-events-none">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-left">
                &nbsp;
              </h3>
              <p className="text-gray-300">
                &nbsp;
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-left">
                &nbsp;
              </h3>
              <ul className="space-y-2 text-gray-300">
                <li>&nbsp;</li>
                <li>&nbsp;</li>
                <li>&nbsp;</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-left">
                &nbsp;
              </h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300">&nbsp;</a></li>
                <li><a href="#" className="text-gray-300">&nbsp;</a></li>
                <li><a href="#" className="text-gray-300">&nbsp;</a></li>
                <li><a href="#" className="text-gray-300">&nbsp;</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-400 opacity-0 pointer-events-none">
            <p>
              &nbsp;
            </p>
          </div>
        </div>
      </footer>
    );
  }

  // Если есть настройки (кэшированные или загруженные), отображаем их
  if (footerSettings && generalSettings) {
    return <Footer settings={footerSettings} generalSettings={generalSettings} />;
  }

  // Если нет ни кэшированных, ни загруженных настроек, показываем пустой футер
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 opacity-0 pointer-events-none">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-left"> </h3>
            <p className="text-gray-300"> </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4 text-left"> </h3>
            <ul className="space-y-2 text-gray-300">
              <li> </li>
              <li> </li>
              <li> </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4 text-left"> </h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-300"> </a></li>
              <li><a href="#" className="text-gray-300"> </a></li>
              <li><a href="#" className="text-gray-300"> </a></li>
              <li><a href="#" className="text-gray-300"> </a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-400 opacity-0 pointer-events-none">
          <p> </p>
        </div>
      </div>
    </footer>
  );
}