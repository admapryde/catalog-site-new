import type { Metadata } from "next";
import { createClient } from '@/lib/supabase-server';
import "./globals.css";
import ClientLayoutWrapper from "./layout.client-wrapper";

// Указываем, что метаданные должны генерироваться динамически
export const dynamic = 'force-dynamic';

// Глобальная переменная для хранения времени последнего обновления favicon
declare global {
  var lastFaviconUpdate: number | undefined;
}

if (!global.lastFaviconUpdate) {
  global.lastFaviconUpdate = Date.now();
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    // Используем кэшированную функцию получения настроек
    const settings = await import('@/services/general-settings-service')
      .then(mod => mod.getGeneralSettings());

    // Генерируем уникальный параметр для предотвращения кэширования favicon
    // Если это стандартный favicon.png, добавляем параметр времени последнего обновления
    let faviconUrl = settings.site_icon || "/favicon.png";

    if (faviconUrl === "/favicon.png" || faviconUrl === "/favicon.ico" ||
        faviconUrl.includes('/favicon.png') || faviconUrl.includes('/favicon.ico')) {
      // Используем глобальную переменную для времени последнего обновления
      const updateTime = global.lastFaviconUpdate || Date.now();
      // Используем favicon.png как основной формат
      faviconUrl = `/favicon.png?v=${updateTime}`;
    }
    // Если используется внешний URL для иконки, используем его как есть

    return {
      title: settings.site_title || "Универсальный каталог",
      description: "Динамический сайт-каталог для различных отраслей",
      icons: {
        icon: faviconUrl,
      },
    };
  } catch (error: any) {
    console.error('Ошибка получения настроек для метаданных:', error);
    // Возвращаем значения по умолчанию в случае ошибки
    const updateTime = global.lastFaviconUpdate || Date.now();
    return {
      title: "Универсальный каталог",
      description: "Динамический сайт-каталог для различных отраслей",
      icons: {
        icon: `/favicon.png?v=${updateTime}`,
      },
    };
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="icon" href="/favicon.png" type="image/x-icon" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,100..900;1,100..900&family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
      </body>
    </html>
  );
}
