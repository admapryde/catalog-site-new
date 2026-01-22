'use client';

import { useState, useEffect } from 'react';
import { Template, TemplateSpec } from '@/types';
import { useNotification } from '@/hooks/useNotification';
import { SpecType, TemplateWithSpecs } from '@/types';

export default function TemplatesManager() {
  const [templates, setTemplates] = useState<TemplateWithSpecs[]>([]);
  const [specTypes, setSpecTypes] = useState<SpecType[]>([]);
  const [filteredSpecTypes, setFilteredSpecTypes] = useState<SpecType[]>([]);
  const [name, setName] = useState('');
  const [newSpec, setNewSpec] = useState({ property_name: '', value: '', spec_type_id: '' });
  const [specs, setSpecs] = useState<{ property_name: string; value: string; spec_type_id?: string }[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const { showNotification, renderNotification } = useNotification();

  // Функция для получения шаблонов
  const updateTemplatesList = async () => {
    try {
      const response = await fetch('/api/admin/templates');
      if (!response.ok) {
        throw new Error(`Ошибка загрузки шаблонов: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setTemplates(data);
    } catch (error: any) {
      console.error('Ошибка загрузки шаблонов:', error);
      showNotification(error.message || 'Ошибка загрузки шаблонов', 'error');
    }
  };

  // Загрузка шаблонов и типов характеристик при монтировании компонента
  useEffect(() => {
    const fetchData = async () => {
      try {
        await updateTemplatesList();

        // Загрузка типов характеристик
        const specTypesResponse = await fetch('/api/spec-types');
        if (!specTypesResponse.ok) {
          throw new Error(`Ошибка загрузки типов характеристик: ${specTypesResponse.status} ${specTypesResponse.statusText}`);
        }
        const specTypesData = await specTypesResponse.json();
        setSpecTypes(specTypesData);
        setFilteredSpecTypes(specTypesData); // Показываем все типы характеристик для шаблонов
      } catch (error: any) {
        console.error('Ошибка загрузки данных:', error);
        showNotification(error.message || 'Ошибка загрузки данных', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Функция для получения русского названия типа характеристики
  const getRussianSpecTypeName = (name: string, filterType: string) => {
    switch(filterType) {
      case 'RANGE':
        return 'Диапазон';
      case 'CHECKBOXES':
        return 'Чек-бокс';
      case 'RADIO':
        return 'Радио';
      case 'SELECT':
        return 'Выпадающий список';
      default:
        return name;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        // Обновление существующего шаблона
        const response = await fetch('/api/admin/templates', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingId,
            name,
            specs
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Ошибка обновления шаблона');
        }

        const updatedTemplate = await response.json();
        setTemplates(templates.map(temp =>
          temp.id === editingId ? updatedTemplate : temp
        ));

        showNotification('Шаблон успешно обновлен!', 'success');
      } else {
        // Создание нового шаблона
        const response = await fetch('/api/admin/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            specs
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Ошибка создания шаблона');
        }

        const newTemplate = await response.json();
        setTemplates([...templates, newTemplate]);

        showNotification('Шаблон успешно создан!', 'success');
      }

      // Сброс формы
      setName('');
      setSpecs([]);
      setNewSpec({ property_name: '', value: '', spec_type_id: '' });
      setEditingId(null);
    } catch (error: any) {
      console.error('Ошибка сохранения шаблона:', error);
      showNotification(error.message || 'Произошла ошибка при сохранении шаблона', 'error');
    }
  };

  const handleEdit = (template: TemplateWithSpecs) => {
    setName(template.name);
    setSpecs(template.specs.map(spec => ({
      property_name: spec.property_name,
      value: spec.value,
      spec_type_id: spec.spec_type_id || ''
    })));
    setEditingId(template.id);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этот шаблон?')) {
      try {
        const response = await fetch(`/api/admin/templates?id=${id}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Ошибка удаления шаблона');
        }

        setTemplates(templates.filter(temp => temp.id !== id));
        showNotification('Шаблон успешно удален!', 'success');
      } catch (error: any) {
        console.error('Ошибка удаления шаблона:', error);
        showNotification(error.message || 'Произошла ошибка при удалении шаблона', 'error');
      }
    }
  };

  const addSpec = () => {
    if (newSpec.property_name && newSpec.value) {
      setSpecs([...specs, { ...newSpec }]);
      setNewSpec({ property_name: '', value: '', spec_type_id: '' });
    }
  };

  const removeSpec = (index: number) => {
    setSpecs(specs.filter((_, i) => i !== index));
  };

  const updateSpecProperty = (index: number, property: 'property_name' | 'value' | 'spec_type_id', value: string) => {
    const newSpecs = [...specs];
    newSpecs[index] = { ...newSpecs[index], [property]: value };
    setSpecs(newSpecs);
  };

  const moveSpecUp = (index: number) => {
    if (index > 0) {
      const newSpecs = [...specs];
      [newSpecs[index - 1], newSpecs[index]] = [newSpecs[index], newSpecs[index - 1]];
      setSpecs(newSpecs);
    }
  };

  const moveSpecDown = (index: number) => {
    if (index < specs.length - 1) {
      const newSpecs = [...specs];
      [newSpecs[index], newSpecs[index + 1]] = [newSpecs[index + 1], newSpecs[index]];
      setSpecs(newSpecs);
    }
  };

  if (loading) {
    return <div className="p-4">Загрузка...</div>;
  }

  return (
    <div className="p-6">
      {renderNotification()}
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {editingId ? 'Редактировать шаблон' : 'Добавить новый шаблон'}
      </h2>

      <form onSubmit={handleSubmit} className="mb-8 p-4 bg-white rounded-lg shadow-md">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
            Название шаблона
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>

        {/* Управление характеристиками шаблона */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Характеристики шаблона</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="propertyName">
                Название характеристики
              </label>
              <input
                id="propertyName"
                type="text"
                value={newSpec.property_name}
                onChange={(e) => setNewSpec({...newSpec, property_name: e.target.value})}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Например: Материал"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="propertyValue">
                Значение
              </label>
              <input
                id="propertyValue"
                type="text"
                value={newSpec.value}
                onChange={(e) => setNewSpec({...newSpec, value: e.target.value})}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Например: Дерево"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="specTypeId">
              Тип характеристики
            </label>
            <select
              id="specTypeId"
              value={newSpec.spec_type_id || ''}
              onChange={(e) => setNewSpec({...newSpec, spec_type_id: e.target.value})}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="">Выберите тип характеристики</option>
              {specTypes.map((specType) => (
                <option key={specType.id} value={specType.id}>
                  {getRussianSpecTypeName(specType.name, specType.filter_type)} ({specType.filter_type})
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={addSpec}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Добавить характеристику
          </button>

          {specs.length > 0 && (
            <div className="mt-4">
              <h4 className="text-md font-medium text-gray-700 mb-2">Добавленные характеристики:</h4>
              <ul className="divide-y divide-gray-200">
                {specs.map((spec, index) => (
                  <li
                    key={`spec-${index}`}
                    className="py-2 flex justify-between items-center"
                  >
                    <div className="flex items-center flex-grow">
                      <div className="flex flex-col mr-2">
                        <button
                          type="button"
                          onClick={() => moveSpecUp(index)}
                          disabled={index === 0}
                          className={`p-1 rounded ${index === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200'}`}
                          title="Переместить вверх"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSpecDown(index)}
                          disabled={index === specs.length - 1}
                          className={`p-1 rounded ${index === specs.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200'}`}
                          title="Переместить вниз"
                        >
                          ↓
                        </button>
                      </div>
                      <input
                        type="text"
                        value={spec.property_name}
                        onChange={(e) => updateSpecProperty(index, 'property_name', e.target.value)}
                        className="shadow appearance-none border rounded py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mr-2 flex-grow"
                        placeholder="Название"
                      />
                      <span className="mx-2">:</span>
                      <input
                        type="text"
                        value={spec.value}
                        onChange={(e) => updateSpecProperty(index, 'value', e.target.value)}
                        className="shadow appearance-none border rounded py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline flex-grow"
                        placeholder="Значение"
                      />
                      <select
                        value={spec.spec_type_id || ''}
                        onChange={(e) => updateSpecProperty(index, 'spec_type_id', e.target.value)}
                        className="shadow appearance-none border rounded py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ml-2"
                      >
                        <option value="">Тип...</option>
                        {specTypes.map((specType) => (
                          <option key={specType.id} value={specType.id}>
                            {getRussianSpecTypeName(specType.name, specType.filter_type)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSpec(index)}
                      className="text-red-600 hover:text-red-900 ml-4"
                    >
                      Удалить
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            {editingId ? 'Обновить' : 'Создать'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setName('');
                setSpecs([]);
                setNewSpec({ property_name: '', value: '', spec_type_id: '' });
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
                Характеристики
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {templates.map((template) => (
              <tr key={template.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{template.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {template.specs.length} {template.specs.length === 1 ? 'характеристика' : 'характеристик(и)'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(template)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Редактировать
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
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
}