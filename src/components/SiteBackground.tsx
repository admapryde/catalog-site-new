'use client';

import { useEffect, useState } from 'react';

interface SiteBackgroundProps {
  bgImage?: string;
}

export default function SiteBackground({ bgImage }: SiteBackgroundProps) {
  const [bgLoaded, setBgLoaded] = useState(false);

  useEffect(() => {
    if (bgImage) {
      // Загружаем изображение для предотвращения мерцания
      const img = new Image();
      img.onload = () => setBgLoaded(true);
      img.onerror = () => setBgLoaded(false);
      img.src = bgImage;
    } else {
      setBgLoaded(false);
    }
  }, [bgImage]);

  if (!bgImage || !bgLoaded) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[-1] w-full h-full"
      style={{
        backgroundImage: `url("${bgImage}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    />
  );
}