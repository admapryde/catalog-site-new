'use client';

import { useState, useEffect } from 'react';
import { BannerGroup, Banner } from '@/types';
import FileUpload from '@/components/admin/FileUpload';
import OptimizedImage from '@/components/OptimizedImage';
import { useNotification } from '@/hooks/useNotification';

export default function BannerManager() {
  const [groups, setGroups] = useState<BannerGroup[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [title, setTitle] = useState('');
  const [groupId, setGroupId] = useState('');
  const [image, setImage] = useState('');
  const [link, setLink] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'groups' | 'banners'>('groups');
  const [loading, setLoading] = useState(true);

  const { showNotification, renderNotification } = useNotification();

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
        // Сортируем группы по position
        const sortedGroups = groupsData.sort((a, b) => a.position - b.position);
        setGroups(sortedGroups);

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

  // Сортировка баннеров при изменении баннеров или групп
  useEffect(() => {
    if (banners.length > 0 && groups.length > 0) {
      // Сортируем баннеры по группам (в соответствии с порядком групп) и внутри групп по sort_order
      const sortedBanners = [...banners].sort((a, b) => {
        // Находим позиции групп в отсортированном списке групп
        const groupA = groups.find(g => g.id === a.group_id);
        const groupB = groups.find(g => g.id === b.group_id);

        if (groupA && groupB) {
          // Сортируем по позиции группы, затем внутри группы по sort_order
          if (groupA.position !== groupB.position) {
            return groupA.position - groupB.position;
          }
        }

        // Если группы не найдены или имеют одинаковую позицию, сортируем по ID группы, затем по sort_order
        if (a.group_id !== b.group_id) {
          const groupAIndex = groups.findIndex(g => g.id === a.group_id);
          const groupBIndex = groups.findIndex(g => g.id === b.group_id);
          return groupAIndex - groupBIndex;
        }

        // Потом внутри группы по sort_order
        return a.sort_order - b.sort_order;
      });

      // Проверяем, изменился ли порядок
      const isDifferent = sortedBanners.some((banner, index) => banner.id !== banners[index]?.id);
      if (isDifferent) {
        setBanners(sortedBanners);
      }
    }
  }, [banners, groups]);

  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingGroupId) {
        // Обновление существующей группы (сохраняем текущую позицию)
        const currentGroup = groups.find(g => g.id === editingGroupId);
        const response = await fetch('/api/admin/banner-groups', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingGroupId, title, position: currentGroup?.position })
        });

        if (!response.ok) {
          throw new Error('Ошибка обновления группы');
        }

        const updatedGroup = await response.json();
        const updatedGroups = groups.map(g =>
          g.id === editingGroupId ? updatedGroup[0] : g
        ).sort((a, b) => a.position - b.position);
        setGroups(updatedGroups);
      } else {
        // Создание новой группы
        const response = await fetch('/api/admin/banner-groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, position: groups.length + 1 })
        });

        if (!response.ok) {
          throw new Error('Ошибка создания группы');
        }

        const newGroup = await response.json();
        // Добавляем новую группу в конец списка с правильным порядковым номером
        const updatedGroups = [...groups, newGroup[0]].sort((a, b) => a.position - b.position);
        setGroups(updatedGroups);
      }

      // Сброс формы
      setTitle('');
      setEditingGroupId(null);
    } catch (error) {
      console.error('Ошибка сохранения группы:', error);
    }
  };

  const handleBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingBannerId) {
        // Обновление существующего баннера (сохраняем текущий порядок сортировки)
        const currentBanner = banners.find(b => b.id === editingBannerId);
        const response = await fetch('/api/admin/banners', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingBannerId, group_id: groupId, image_url: image, link_url: link, sort_order: currentBanner?.sort_order })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Ошибка обновления баннера');
        }

        const updatedBanner = await response.json();
        const updatedBanners = banners.map(b =>
          b.id === editingBannerId ? updatedBanner[0] : b
        );
        setBanners(updatedBanners);

        showNotification('Баннер успешно обновлен!', 'success');
      } else {
        // Создание нового баннера
        // Определяем порядок сортировки как количество баннеров в группе + 1
        const bannersInGroup = banners.filter(b => b.group_id === groupId);
        const newSortOrder = bannersInGroup.length;

        const response = await fetch('/api/admin/banners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ group_id: groupId, image_url: image, link_url: link, sort_order: newSortOrder })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Ошибка создания баннера');
        }

        const newBanner = await response.json();
        // После добавления баннера обновляем список
        const updatedBanners = [...banners, newBanner[0]];
        setBanners(updatedBanners);

        showNotification('Баннер успешно создан!', 'success');
      }

      // Сброс формы
      setGroupId('');
      setImage('');
      setLink('');
      setEditingBannerId(null);
    } catch (error: any) {
      console.error('Ошибка сохранения баннера:', error);
      showNotification(error.message || 'Произошла ошибка при сохранении баннера', 'error');
    }
  };

  const handleEditGroup = (group: BannerGroup) => {
    setTitle(group.title);
    setEditingGroupId(group.id);
    setActiveTab('groups');
  };

  const handleEditBanner = (banner: Banner) => {
    setGroupId(banner.group_id);
    setImage(banner.image_url);
    setLink(banner.link_url);
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
          const errorData = await response.json();
          throw new Error(errorData.error || 'Ошибка удаления группы');
        }

        // Обновляем список групп без удаленной и пересчитываем порядок
        const filteredGroups = groups.filter(g => g.id !== id);
        const reorderedGroups = filteredGroups.map((group, index) => ({
          ...group,
          position: index + 1  // Позиции начинаются с 1
        }));

        setGroups(reorderedGroups);
        // Также удалим связанные баннеры
        setBanners(banners.filter(b => b.group_id !== id));

        showNotification('Группа баннеров успешно удалена!', 'success');
      } catch (error: any) {
        console.error('Ошибка удаления группы:', error);
        showNotification(error.message || 'Произошла ошибка при удалении группы баннеров', 'error');
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
          const errorData = await response.json();
          throw new Error(errorData.error || 'Ошибка удаления баннера');
        }

        // Обновляем список баннеров без удаленного
        const filteredBanners = banners.filter(b => b.id !== id);
        setBanners(filteredBanners);

        showNotification('Баннер успешно удален!', 'success');
      } catch (error: any) {
        console.error('Ошибка удаления баннера:', error);
        showNotification(error.message || 'Произошла ошибка при удалении баннера', 'error');
      }
    }
  };

  const moveBannerUp = async (bannerId: string) => {
    const bannerToMove = banners.find(b => b.id === bannerId);
    if (!bannerToMove) return;

    // Получаем все баннеры в той же группе
    const bannersInGroup = banners.filter(b => b.group_id === bannerToMove.group_id);
    const currentIndex = bannersInGroup.findIndex(b => b.id === bannerId);

    if (currentIndex === 0) return; // Уже первый в группе

    // Создаем новый массив с обновленным порядком
    const newBannersInGroup = [...bannersInGroup];
    const movedBanner = newBannersInGroup.splice(currentIndex, 1)[0];
    newBannersInGroup.splice(currentIndex - 1, 0, movedBanner);

    // Обновляем sort_order для баннеров в группе
    const reorderedBannersInGroup = newBannersInGroup.map((banner, idx) => ({
      ...banner,
      sort_order: idx
    }));

    // Обновляем весь список баннеров
    const updatedBanners = banners.map(banner => {
      const updatedBanner = reorderedBannersInGroup.find(updated => updated.id === banner.id);
      return updatedBanner || banner;
    });

    // Обновляем порядок в базе данных
    try {
      await Promise.all(
        reorderedBannersInGroup.map(banner =>
          fetch('/api/admin/banners', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: banner.id,
              group_id: banner.group_id,
              image_url: banner.image_url,
              link_url: banner.link_url,
              sort_order: banner.sort_order
            })
          })
        )
      );

      // Обновляем состояние только после успешного сохранения
      setBanners(updatedBanners);
    } catch (error) {
      console.error('Ошибка обновления порядка баннеров:', error);
      // В случае ошибки не обновляем состояние
    }
  };

  const moveBannerDown = async (bannerId: string) => {
    const bannerToMove = banners.find(b => b.id === bannerId);
    if (!bannerToMove) return;

    // Получаем все баннеры в той же группе
    const bannersInGroup = banners.filter(b => b.group_id === bannerToMove.group_id);
    const currentIndex = bannersInGroup.findIndex(b => b.id === bannerId);

    if (currentIndex === bannersInGroup.length - 1) return; // Уже последний в группе

    // Создаем новый массив с обновленным порядком
    const newBannersInGroup = [...bannersInGroup];
    const movedBanner = newBannersInGroup.splice(currentIndex, 1)[0];
    newBannersInGroup.splice(currentIndex + 1, 0, movedBanner);

    // Обновляем sort_order для баннеров в группе
    const reorderedBannersInGroup = newBannersInGroup.map((banner, idx) => ({
      ...banner,
      sort_order: idx
    }));

    // Обновляем весь список баннеров
    const updatedBanners = banners.map(banner => {
      const updatedBanner = reorderedBannersInGroup.find(updated => updated.id === banner.id);
      return updatedBanner || banner;
    });

    // Обновляем порядок в базе данных
    try {
      await Promise.all(
        reorderedBannersInGroup.map(banner =>
          fetch('/api/admin/banners', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: banner.id,
              group_id: banner.group_id,
              image_url: banner.image_url,
              link_url: banner.link_url,
              sort_order: banner.sort_order
            })
          })
        )
      );

      // Обновляем состояние только после успешного сохранения
      setBanners(updatedBanners);
    } catch (error) {
      console.error('Ошибка обновления порядка баннеров:', error);
      // В случае ошибки не обновляем состояние
    }
  };

  const moveGroupUp = async (index: number) => {
    if (index === 0) return; // Первая группа, нельзя двигать выше

    // Создаем новый массив с обновленным порядком
    const newGroups = [...groups];
    const movedGroup = newGroups.splice(index, 1)[0];
    newGroups.splice(index - 1, 0, movedGroup);

    // Обновляем position для всех групп
    const reorderedGroups = newGroups.map((group, idx) => ({
      ...group,
      position: idx + 1  // Позиции начинаются с 1
    }));

    // Обновляем порядок в базе данных
    try {
      await Promise.all(
        reorderedGroups.map(group =>
          fetch('/api/admin/banner-groups', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: group.id,
              title: group.title,
              position: group.position
            })
          })
        )
      );

      // Обновляем состояние только после успешного сохранения
      setGroups(reorderedGroups);
    } catch (error) {
      console.error('Ошибка обновления порядка групп баннеров:', error);
      // В случае ошибки не обновляем состояние
    }
  };

  const moveGroupDown = async (index: number) => {
    if (index === groups.length - 1) return; // Последняя группа, нельзя двигать ниже

    // Создаем новый массив с обновленным порядком
    const newGroups = [...groups];
    const movedGroup = newGroups.splice(index, 1)[0];
    newGroups.splice(index + 1, 0, movedGroup);

    // Обновляем position для всех групп
    const reorderedGroups = newGroups.map((group, idx) => ({
      ...group,
      position: idx + 1  // Позиции начинаются с 1
    }));

    // Обновляем порядок в базе данных
    try {
      await Promise.all(
        reorderedGroups.map(group =>
          fetch('/api/admin/banner-groups', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: group.id,
              title: group.title,
              position: group.position
            })
          })
        )
      );

      // Обновляем состояние только после успешного сохранения
      setGroups(reorderedGroups);
    } catch (error) {
      console.error('Ошибка обновления порядка групп баннеров:', error);
      // В случае ошибки не обновляем состояние
    }
  };

  if (loading) {
    return <div className="p-4">Загрузка...</div>;
  }

  return (
    <div className="p-6">
      {renderNotification()}
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
            <div className="mb-4">
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
                    Перемещение
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {groups.map((group, index) => (
                  <tr key={group.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{group.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => moveGroupUp(index)}
                          disabled={index === 0}
                          className={`p-1 rounded ${index === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-blue-600'}`}
                          title="Переместить вверх"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button
                          onClick={() => moveGroupDown(index)}
                          disabled={index === groups.length - 1}
                          className={`p-1 rounded ${index === groups.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-blue-600'}`}
                          title="Переместить вниз"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
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
            <div className="mb-4">
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
            <div className="mb-4">
              {image && (
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Текущее изображение
                  </label>
                  <div className="flex items-center">
                    <img
                      src={image}
                      alt="Текущее изображение баннера"
                      className="h-16 w-16 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => setImage('')}
                      className="ml-4 text-red-600 hover:text-red-800 text-sm"
                    >
                      Удалить изображение
                    </button>
                  </div>
                </div>
              )}
              <FileUpload
                onFileUpload={(urls) => setImage(urls[0] || '')}
                folder="banners"
                label="Загрузить изображение баннера"
              />
            </div>
            <div className="mb-4">
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
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Отмена
                </button>
              )}
            </div>
          </form>

          {/* Отображение отдельной таблицы для каждой группы баннеров */}
          {groups.map((group) => {
            const groupBanners = banners.filter(banner => banner.group_id === group.id);

            return (
              <div key={group.id} className="mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">{group.title}</h3>
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Изображение
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ссылка
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Перемещение
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Действия
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {groupBanners.map((banner, index) => (
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <a href={banner.link_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {banner.link_url}
                            </a>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => moveBannerUp(banner.id)}
                                disabled={index === 0}
                                className={`p-1 rounded ${index === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-blue-600'}`}
                                title="Переместить вверх"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                              <button
                                onClick={() => moveBannerDown(banner.id)}
                                disabled={index === groupBanners.length - 1}
                                className={`p-1 rounded ${index === groupBanners.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-blue-600'}`}
                                title="Переместить вниз"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
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
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}