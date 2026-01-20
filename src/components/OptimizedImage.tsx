'use client';

import Image from 'next/image';
import { useState } from 'react';
import styles from '@/components/optimized-image.module.css';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  sizes?: string;
  loading?: 'lazy' | 'eager';
  style?: React.CSSProperties;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

// Функция для определения, является ли изображение из Cloudinary
const isCloudinaryImage = (src: string): boolean => {
  return src.includes('res.cloudinary.com');
};

// Функция для оптимизации URL изображения из Cloudinary
const getOptimizedCloudinaryUrl = (src: string, width?: number, height?: number): string => {
  if (!isCloudinaryImage(src)) {
    return src;
  }

  // Разбиваем URL на части
  const urlParts = src.split('/');

  // Находим индекс, где начинается путь к изображению (обычно после /upload/)
  const uploadIndex = urlParts.findIndex(part => part === 'upload');

  if (uploadIndex !== -1) {
    // Создаем параметры оптимизации
    let transformationParams = 'f_auto,q_auto'; // автоматический формат и качество

    if (width) {
      transformationParams += `,w_${width}`;
    }

    if (height) {
      transformationParams += `,h_${height}`;
    }

    // Вставляем параметры оптимизации после /upload/
    urlParts.splice(uploadIndex + 1, 0, transformationParams);

    return urlParts.join('/');
  }

  return src;
};

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className = '',
  sizes,
  loading = 'lazy',
  style,
  onError,
  placeholder,
  blurDataURL
}: OptimizedImageProps) {
  // Проверяем, является ли изображение локальным
  const isLocalImage = src.startsWith('/') ||
                       src.includes('localhost') ||
                       src.includes('127.0.0.1');

  // Проверяем, является ли изображение из Cloudinary
  const isCloudinary = isCloudinaryImage(src);

  // Для локальных изображений используем компонент Image
  if (isLocalImage) {
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        className={className}
        sizes={sizes}
        loading={loading}
        style={style}
        onError={onError}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
      />
    );
  }

  // Для изображений из Cloudinary применяем оптимизацию и используем компонент Image
  if (isCloudinary) {
    const optimizedSrc = getOptimizedCloudinaryUrl(src, width, height);

    // Для изображений из Cloudinary можем использовать blur-плейсхолдер
    // путем получения уменьшенной версии изображения
    let placeholderProps = {};
    if (placeholder === 'blur' && !blurDataURL) {
      // Генерируем blurDataURL из основного изображения с уменьшенными размерами и эффектом размытия
      const parts = src.split('/');
      const uploadIndex = parts.findIndex(part => part === 'upload');

      if (uploadIndex !== -1) {
        // Создаем URL для маленькой размытой версии изображения
        const blurParts = [...parts];
        const blurTransformation = 'f_auto,w_50,h_50,c_limit,q_auto/e_blur:200'; // маленький размер и эффект размытия
        blurParts.splice(uploadIndex + 1, 0, blurTransformation);

        placeholderProps = {
          placeholder: 'blur' as const,
          blurDataURL: blurParts.join('/'),
        };
      }
    } else if (blurDataURL) {
      placeholderProps = {
        placeholder: 'blur' as const,
        blurDataURL,
      };
    } else if (placeholder) {
      placeholderProps = { placeholder };
    }

    return (
      <Image
        src={optimizedSrc}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        className={className}
        sizes={sizes}
        loading={loading}
        style={style}
        onError={onError}
        {...placeholderProps}
      />
    );
  }

  // Для остальных внешних изображений используем тег img напрямую
  if (fill) {
    // Объединяем классы, но избегаем дублирования
    const combinedClassName = className ? `${styles.optimizedImageFill} ${className}` : styles.optimizedImageFill;

    return (
      <img
        src={src}
        alt={alt}
        className={combinedClassName}
        loading={loading}
        style={style}
        onError={onError}
      />
    );
  } else {
    // Для обычных изображений используем тег img напрямую
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        loading={loading}
        style={style}
        onError={onError}
      />
    );
  }
}