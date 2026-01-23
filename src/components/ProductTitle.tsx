'use client';

import { useState, useEffect, useRef } from 'react';
import styles from '@/components/products-grid-content.module.css';

interface ProductTitleProps {
  title: string;
  className?: string;
}

const ProductTitle = ({ title, className }: ProductTitleProps) => {
  const [fontSize, setFontSize] = useState(20); // начальный размер шрифта (примерно 1.25rem)
  const textRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!textRef.current || !title) return;

    const element = textRef.current;
    const parent = element.parentElement;
    if (!parent) return;

    // Получаем доступные размеры
    const availableWidth = parent.clientWidth;
    const availableHeight = 48; // ограничиваем высоту (примерно 3rem в пикселях)

    // Начинаем с максимального размера шрифта и уменьшаем, пока текст помещается
    let currentSize = 20; // начальный размер
    element.style.fontSize = `${currentSize}px`;

    // Проверяем, помещается ли текст по ширине и высоте
    while ((element.scrollWidth > availableWidth || element.scrollHeight > availableHeight) && currentSize > 10) {
      currentSize -= 0.5;
      element.style.fontSize = `${currentSize}px`;
    }

    setFontSize(currentSize);
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
      style={{ fontSize: `${fontSize}px` }}
    >
      {title}
    </h3>
  );
};

export default ProductTitle;