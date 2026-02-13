'use client';

import { useState, useEffect, useRef } from 'react';
import styles from '@/components/products-grid-content.module.css';

interface ProductTitleProps {
  title: string;
  className?: string;
}

const ProductTitle = ({ title, className }: ProductTitleProps) => {
  const [fontSize, setFontSize] = useState<number | null>(null); // начальный размер шрифта (примерно 1.25rem)
  const textRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!textRef.current || !title) return;

    // Используем requestAnimationFrame для группировки операций чтения и записи
    const rafId = requestAnimationFrame(() => {
      const element = textRef.current;
      if (!element) return;

      const parent = element.parentElement;
      if (!parent) return;

      // Сначала читаем все необходимые геометрические данные (фаза чтения)
      const availableWidth = parent.clientWidth;
      const availableHeight = 48; // ограничиваем высоту (примерно 3rem в пикселях)

      // Временно устанавливаем большой размер шрифта для измерения
      element.style.fontSize = '20px';
      element.style.position = 'absolute';
      element.style.visibility = 'hidden';
      element.style.whiteSpace = 'nowrap';
      
      // Читаем размеры
      const naturalWidth = element.scrollWidth;
      const naturalHeight = element.scrollHeight;
      
      // Восстанавливаем нормальное состояние
      element.style.position = '';
      element.style.visibility = '';
      element.style.whiteSpace = '';
      
      // Рассчитываем подходящий размер шрифта
      let calculatedSize = 20;
      
      // Ограничиваем по ширине
      if (naturalWidth > 0) {
        const widthRatio = availableWidth / naturalWidth;
        calculatedSize = Math.min(calculatedSize, calculatedSize * widthRatio);
      }
      
      // Ограничиваем по высоте
      const heightRatio = availableHeight / naturalHeight;
      calculatedSize = Math.min(calculatedSize, calculatedSize * heightRatio);
      
      // Ограничиваем минимальный размер
      calculatedSize = Math.max(calculatedSize, 10);
      
      // Устанавливаем рассчитанный размер (фаза записи)
      setFontSize(calculatedSize);
    });

    return () => cancelAnimationFrame(rafId);
  }, [title]);

  // Определяем, какой класс использовать для hover-эффекта в зависимости от переданных классов
  const classes = className ? className.split(' ') : [];
  const isHomepageSectionTitle = classes.some(cls => cls.includes('homepageSectionCardTitle'));
  const hoverClass = isHomepageSectionTitle
    ? 'homepageSectionCardTitleHoverable'
    : styles.productCardTitleHoverable;

  const finalClassName = className
    ? `${className} ${hoverClass}`
    : hoverClass;

  return (
    <h3
      ref={textRef}
      className={finalClassName}
      style={fontSize !== null ? { fontSize: `${fontSize}px` } : undefined}
    >
      {title}
    </h3>
  );
};

export default ProductTitle;