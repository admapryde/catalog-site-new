// components/admin/DashboardPage.tsx

'use client';

import { useState, useEffect } from 'react';
import AuditHistoryDashboard from '../../src/components/admin/AuditHistoryDashboard';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Обзор' },
    { id: 'audit', label: 'История действий' },
    { id: 'analytics', label: 'Аналитика' },
  ];

  return (
    <div>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Навигационные вкладки */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Содержимое вкладок */}
            <div className="mt-4">
              {activeTab === 'overview' && (
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h2 className="text-lg leading-6 font-medium text-gray-900">Обзор системы</h2>
                    <p className="mt-2 max-w-2xl text-sm text-gray-500">
                      Статистика и ключевые показатели работы системы.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'audit' && (
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <AuditHistoryDashboard />
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h2 className="text-lg leading-6 font-medium text-gray-900">Аналитика</h2>
                    <p className="mt-2 max-w-2xl text-sm text-gray-500">
                      Графики и аналитические данные о работе системы.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}