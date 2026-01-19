import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getFooterSettings } from "@/services/footer-service";
import { getHeaderSettings } from "@/services/header-service";

export const metadata: Metadata = {
  title: "Универсальный каталог",
  description: "Динамический сайт-каталог для различных отраслей",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const footerSettings = await getFooterSettings();
  const headerSettings = await getHeaderSettings();

  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,100..900;1,100..900&family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <div className="flex flex-col min-h-screen">
          <Header settings={headerSettings} />
          <main className="flex-grow">{children}</main>
          <Footer settings={footerSettings} />
        </div>
      </body>
    </html>
  );
}
