'use client';

import { useState } from 'react';

interface ShareButtonProps {
  productName: string;
  productUrl: string;
}

const ShareButton = ({ productName, productUrl }: ShareButtonProps) => {
  const [showNotification, setShowNotification] = useState(false);

  // Функция для определения типа устройства
  const isMobileDevice = () => {
    if (typeof window === 'undefined') return false;

    // Проверяем user agent для определения мобильного устройства
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // Функция для копирования ссылки и показа уведомления
  const copyLink = async () => {
    if (typeof window === 'undefined') return;

    // Формируем полный URL для открытия модального окна на главной странице
    const fullUrl = productUrl.startsWith('http') ? productUrl :
                   productUrl.startsWith('/product/') ?
                   `${window.location.origin}/?openModal=${productUrl.split('/')[2]}` :
                   `${window.location.origin}${productUrl}`;

    try {
      // Проверяем, доступен ли Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(fullUrl);
      } else {
        // Резервный метод для копирования текста
        const textArea = document.createElement('textarea');
        textArea.value = fullUrl;
        textArea.setAttribute('readonly', '');
        textArea.style.position = 'absolute';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      // Показываем уведомление на десктопе
      if (!isMobileDevice()) {
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 2000); // Скрываем уведомление через 2 секунды
      }
    } catch (err) {
      console.error('Не удалось скопировать ссылку: ', err);
    }
  };

  // Функция для обработки клика по кнопке
  const handleShare = () => {
    if (typeof window === 'undefined') return;

    // Формируем полный URL для открытия модального окна на главной странице
    const fullUrl = productUrl.startsWith('http') ? productUrl :
                   productUrl.startsWith('/product/') ?
                   `${window.location.origin}/?openModal=${productUrl.split('/')[2]}` :
                   `${window.location.origin}${productUrl}`;

    if (isMobileDevice()) {
      // Проверяем, поддерживает ли браузер Web Share API
      // Используем Web Share API только если соединение безопасное (HTTPS) или это localhost
      const isSecureConnection = window.location.protocol === 'https:' ||
                                window.location.hostname === 'localhost' ||
                                window.location.hostname === '127.0.0.1';

      if (navigator.share && isSecureConnection) {
        // Проверяем, что все необходимые параметры доступны
        if (productName && fullUrl) {
          navigator.share({
            title: productName,
            text: productName, // Добавляем текст для лучшей совместимости
            url: fullUrl
          })
          .then(() => console.log('Успешно поделились'))
          .catch(error => {
            console.error('Ошибка при попытке поделиться:', error);
            // Если произошла ошибка, используем резервный метод
            copyLink();
          });
        } else {
          // Если нет необходимых параметров, используем резервный метод
          copyLink();
        }
      } else {
        // Резервный вариант: копируем ссылку
        // На мобильных устройствах с небезопасным соединением
        copyLink();
      }
    } else {
      // На десктопе просто копируем ссылку
      copyLink();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleShare}
        className="border border-gray-300 hover:border-gray-400 text-gray-700 font-medium py-3 px-6 rounded-lg transition flex items-center"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
        Поделиться
      </button>

      {/* Уведомление для десктопа */}
      {showNotification && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-2 bg-green-500 text-white text-sm rounded-lg shadow-lg z-20">
          Ссылка скопирована
        </div>
      )}
    </div>
  );
};

export default ShareButton;