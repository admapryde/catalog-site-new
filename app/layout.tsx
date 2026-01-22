import type { Metadata } from "next";
import { createClient } from '@/lib/supabase-server';
import "./globals.css";
import LayoutWrapper from "@/components/LayoutWrapper";

// Указываем, что метаданные должны генерироваться динамически
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  try {
    // Используем кэшированную функцию получения настроек
    const settings = await import('@/services/general-settings-service')
      .then(mod => mod.getGeneralSettings());

    return {
      title: settings.site_title || "Универсальный каталог",
      description: "Динамический сайт-каталог для различных отраслей",
      icons: {
        icon: settings.site_icon || "/favicon.ico",
      },
    };
  } catch (error: any) {
    console.error('Ошибка получения настроек для метаданных:', error);
    // Возвращаем значения по умолчанию в случае ошибки
    return {
      title: "Универсальный каталог",
      description: "Динамический сайт-каталог для различных отраслей",
      icons: {
        icon: "/favicon.ico",
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,100..900;1,100..900&family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
