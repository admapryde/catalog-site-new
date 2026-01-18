'use client';

import { useState, useEffect } from 'react';

export interface AuditLogEntry {
  id: number;
  user_id?: string;
  user_name: string;
  object_type: string;
  object_id?: string;
  action: string;
  created_at: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
}

const AuditHistoryDashboard = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/audit-history?limit=10');
      const result = await response.json();
      
      if (result.success) {
        setLogs(result.data || []);
      } else {
        setError(result.error || 'Не удалось получить историю действий');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'Создан':
        return 'bg-green-100 text-green-800';
      case 'Отредактирован':
        return 'bg-yellow-100 text-yellow-800';
      case 'Удалён':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Последние действия</h2>
        <p className="text-sm text-gray-600">История действий в админ-панели</p>
      </div>

      {/* Состояния загрузки и ошибки */}
      {loading && (
        <div className="py-4 text-center text-gray-500">
          Загрузка истории действий...
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Таблица с историей действий */}
      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Время
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Пользователь
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Объект
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действие
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      {log.user_name}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      {log.object_type} {log.object_id ? `(#${log.object_id})` : ''}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-center text-sm text-gray-500">
                    Нет записей истории действий
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AuditHistoryDashboard;