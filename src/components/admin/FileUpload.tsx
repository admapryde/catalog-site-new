'use client';

import { useState } from 'react';

interface FileUploadProps {
  onFileUpload: (fileUrls: string[]) => void;
  folder: string;
  label?: string;
  multiple?: boolean;
}

export default function FileUpload({ onFileUpload, folder, label = "Загрузить файл", multiple = false }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    // Проверка количества файлов для множественной загрузки
    if (multiple && files.length > 10) { // Ограничение на 10 файлов за раз
      setError('Можно загрузить максимум 10 файлов за раз');
      return;
    }

    const filesToProcess = multiple ? Array.from(files) : [files[0]];

    // Проверка типов и размеров файлов
    for (const file of filesToProcess) {
      // Проверка типа файла
      if (!file.type.startsWith('image/')) {
        setError('Пожалуйста, выберите только изображения');
        return;
      }

      // Проверка размера файла (максимум 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('Один из файлов слишком большой. Максимальный размер 2MB');
        return;
      }
    }

    setError(null);
    setUploading(true);

    try {
      const uploadedUrls: string[] = [];

      // Загружаем файлы по одному
      for (const file of filesToProcess) {
        // Создаем FormData для отправки файла на сервер
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);

        // Отправляем файл на сервер для загрузки в Cloudinary
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Ошибка загрузки файла');
        }

        const data = await response.json();
        uploadedUrls.push(data.url); // Добавляем URL изображения из Cloudinary
      }

      onFileUpload(uploadedUrls); // Передаем массив URL изображений
    } catch (err: any) {
      console.error('Ошибка загрузки изображения:', err);
      setError(err.message || 'Произошла ошибка при загрузке изображения');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    handleFiles(e.target.files);
    // Сбросим значение инпута, чтобы можно было загрузить одинаковые файлы
    e.target.value = '';
  };

  return (
    <div className="mb-4">
      <label className="block text-gray-700 text-sm font-bold mb-2">
        {label}
      </label>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById(`file-upload-${folder}`)?.click()}
      >
        <input
          id={`file-upload-${folder}`}
          type="file"
          multiple={multiple}
          accept="image/*"
          className="hidden"
          onChange={handleChange}
        />
        <div className="flex flex-col items-center justify-center">
          <svg
            className="w-12 h-12 text-gray-400 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            ></path>
          </svg>
          <p className="text-gray-600">
            {uploading
              ? 'Загрузка в Cloudinary...'
              : 'Перетащите файл сюда или нажмите для выбора'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Поддерживаемые форматы: PNG, JPG, WebP</p>
          <p className="text-xs text-gray-500">Максимальный размер: 2MB</p>
        </div>
      </div>
      {error && (
        <p className="text-red-500 text-xs italic mt-2">{error}</p>
      )}
      {uploading && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '100%'}}></div>
          </div>
        </div>
      )}
    </div>
  );
}