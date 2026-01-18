'use client';

import { useState, useEffect } from 'react';
import { BannerGroup, Banner } from '@/types';
import FileUpload from '@/components/admin/FileUpload';
import OptimizedImage from '@/components/OptimizedImage';

export default function BannerManager() {
  const [groups, setGroups] = useState<BannerGroup[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [title, setTitle] = useState('');
  const [position, setPosition] = useState(1);
  const [groupId, setGroupId] = useState('');
  const [image, setImage] = useState('');
  const [link, setLink] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'groups' | 'banners'>('groups');
  const [loading, setLoading] = useState(true);

  // Получение данных из API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Загрузка групп баннеров
        const groupsResponse = await fetch('/api/admin/banner-groups');
        if (!groupsResponse.ok) {
          throw new Error('Ошибка загрузки групп баннеров');
        }
        const groupsData: BannerGroup[] = await groupsResponse.json();
        setGroups(groupsData);

        // Загрузка баннеров
        const bannersResponse = await fetch('/api/admin/banners');
        if (!bannersResponse.ok) {
          throw new Error('Ошибка загрузки баннеров');
        }
        const bannersData: Banner[] = await bannersResponse.json();
        setBanners(bannersData);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingGroupId) {
        // Обновление существующей группы
        const response = await fetch('/api/admin/banner-groups', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingGroupId, title, position })
        });

        if (!response.ok) {
          throw new Error('Ошибка обновления группы');
        }

        const updatedGroup = await response.json();
        setGroups(groups.map(g =>
          g.id === editingGroupId ? updatedGroup[0] : g
        ));
      } else {
        // Создание новой группы
        const response = await fetch('/api/admin/banner-groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, position })
        });

        if (!response.ok) {
          throw new Error('Ошибка создания группы');
        }

        const newGroup = await response.json();
        setGroups([...groups, newGroup[0]]);
      }

      // Сброс формы
      setTitle('');
      setPosition(1);
      setEditingGroupId(null);
    } catch (error) {
      console.error('Ошибка сохранения группы:', error);
    }
  };

  const handleBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingBannerId) {
        // Обновление существующего баннера
        const response = await fetch('/api/admin/banners', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingBannerId, group_id: groupId, image_url: image, link_url: link, sort_order: sortOrder })
        });

        if (!response.ok) {
          throw new Error('Ошибка обновления баннера');
        }

        const updatedBanner = await response.json();
        setBanners(banners.map(b =>
          b.id === editingBannerId ? updatedBanner[0] : b
        ));
      } else {
        // Создание нового баннера
        const response = await fetch('/api/admin/banners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ group_id: groupId, image_url: image, link_url: link, sort_order: sortOrder })
        });

        if (!response.ok) {
          throw new Error('Ошибка создания баннера');
        }

        const newBanner = await response.json();
        setBanners([...banners, newBanner[0]]);
      }

      // Сброс формы
      setGroupId('');
      setImage('');
      setLink('');
      setSortOrder(0);
      setEditingBannerId(null);
    } catch (error) {
      console.error('Ошибка сохранения баннера:', error);
    }
  };

  const handleEditGroup = (group: BannerGroup) => {
    setTitle(group.title);
    setPosition(group.position);
    setEditingGroupId(group.id);
    setActiveTab('groups');
  };

  const handleEditBanner = (banner: Banner) => {
    setGroupId(banner.group_id);
    setImage(banner.image_url);
    setLink(banner.link_url);
    setSortOrder(banner.sort_order);
    setEditingBannerId(banner.id);
    setActiveTab('banners');
  };

  const handleDeleteGroup = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить эту группу баннеров?')) {
      try {
        const response = await fetch(`/api/admin/banner-groups?id=${id}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error('Ошибка удаления группы');
        }

        setGroups(groups.filter(g => g.id !== id));
        // Также удалим связанные баннеры
        setBanners(banners.filter(b => b.group_id !== id));
      } catch (error) {
        console.error('Ошибка удаления группы:', error);
      }
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этот баннер?')) {
      try {
        const response = await fetch(`/api/admin/banners?id=${id}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error('Ошибка удаления баннера');
        }

        setBanners(banners.filter(b => b.id !== id));
      } catch (error) {
        console.error('Ошибка удаления баннера:', error);
      }
    }
  };

  if (loading) {
    return <div className="p-4">Загрузка...</div>;
  }

  return (
    <div className="p-6">
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('groups')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'groups'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Группы баннеров
          </button>
          <button
            onClick={() => setActiveTab('banners')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'banners'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Баннеры
          </button>
        </nav>
      </div>

      {activeTab === 'groups' ? (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {editingGroupId ? 'Редактировать группу' : 'Добавить новую группу'}
          </h2>

          <form onSubmit={handleGroupSubmit} className="mb-8 p-4 bg-white rounded-lg shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                  Название группы
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="position">
                  Позиция на странице
                </label>
                <input
                  id="position"
                  type="number"
                  value={position}
                  onChange={(e) => setPosition(Number(e.target.value))}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                {editingGroupId ? 'Обновить' : 'Создать'}
              </button>
              {editingGroupId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingGroupId(null);
                    setTitle('');
                    setPosition(1);
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Отмена
                </button>
              )}
            </div>
          </form>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Название
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Позиция
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {groups.map((group) => (
                  <tr key={group.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{group.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {group.position}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditGroup(group)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(group.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {editingBannerId ? 'Редактировать баннер' : 'Добавить новый баннер'}
          </h2>

          <form onSubmit={handleBannerSubmit} className="mb-8 p-4 bg-white rounded-lg shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="groupId">
                  Группа баннеров
                </label>
                <select
                  id="groupId"
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="">Выберите группу</option>
                  {groups.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FileUpload
                  onFileUpload={(url) => setImage(url)}
                  folder="banners"
                  label="Загрузить изображение баннера"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="link">
                  Ссылка
                </label>
                <input
                  id="link"
                  type="text"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="sortOrder">
                  Порядок сортировки
                </label>
                <input
                  id="sortOrder"
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                {editingBannerId ? 'Обновить' : 'Создать'}
              </button>
              {editingBannerId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingBannerId(null);
                    setGroupId('');
                    setImage('');
                    setLink('');
                    setSortOrder(0);
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Отмена
                </button>
              )}
            </div>
          </form>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Изображение
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Группа
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ссылка
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Порядок
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {banners.map((banner) => {
                  const group = groups.find(g => g.id === banner.group_id);
                  return (
                    <tr key={banner.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <OptimizedImage
                          src={banner.image_url}
                          alt="Баннер"
                          width={96}
                          height={48}
                          className="h-12 w-24 object-cover rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{group?.title || 'Не указана'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <a href={banner.link_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {banner.link_url}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {banner.sort_order}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditBanner(banner)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          Редактировать
                        </button>
                        <button
                          onClick={() => handleDeleteBanner(banner.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}