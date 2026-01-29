'use client';

import { ReactNode } from 'react';

interface HomepageBlockWrapperProps {
  children: ReactNode;
  type: string;
  position: number;
  visible: boolean;
  enabled: boolean;
  className?: string;
}

const HomepageBlockWrapper = ({ 
  children, 
  type, 
  position, 
  visible, 
  enabled, 
  className = ''
}: HomepageBlockWrapperProps) => {
  // Если блок не включен или не видим, не отображаем его
  if (!enabled || !visible) {
    return null;
  }

  const blockClasses = `homepage-block homepage-block-${type} ${className}`;

  return (
    <div 
      className={blockClasses}
      data-block-type={type}
      data-position={position}
    >
      {children}
    </div>
  );
};

export default HomepageBlockWrapper;