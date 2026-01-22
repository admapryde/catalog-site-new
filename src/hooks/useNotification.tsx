'use client';

import { useState } from 'react';
import Notification from '../components/admin/Notification';

export function useNotification() {
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
  };

  const hideNotification = () => {
    setNotification(null);
  };

  const renderNotification = () => {
    if (!notification) return null;

    return (
      <Notification
        message={notification.message}
        type={notification.type}
        onClose={hideNotification}
      />
    );
  };

  return {
    notification,
    showNotification,
    hideNotification,
    renderNotification
  };
}