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
}

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
  onError
}: OptimizedImageProps) {
  // Проверяем, является ли изображение локальным
  const isLocalImage = src.startsWith('/') ||
                       src.includes('localhost') ||
                       src.includes('127.0.0.1');

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
      />
    );
  }

  // Для внешних изображений с fill создаем максимально совместимую версию
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