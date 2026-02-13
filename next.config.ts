import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Включаем экспериментальные возможности для улучшения производительности
  typedRoutes: true,
  // Включаем Turbopack конфигурацию для Next.js 16
  turbopack: {},
  images: {
    // Настройки для оптимизации изображений
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com', // Основной домен Cloudinary
      },
      {
        protocol: 'https',
        hostname: '*.res.cloudinary.com', // Поддомены Cloudinary
      },
      {
        protocol: 'https',
        hostname: 's1.radikal.cloud', // Домен для изображений товаров
      },
      {
        protocol: 'https',
        hostname: 'i.ibb.co', // Домен для изображений баннеров
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co', // Домены Supabase Storage
      },
      {
        protocol: 'https',
        hostname: 'supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'imgur.com',
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
      },
      {
        protocol: 'https',
        hostname: 'radikal.ru',
      },
      {
        protocol: 'https',
        hostname: 'radikal.cloud',
      },
      {
        protocol: 'https',
        hostname: 'radika1.link',
      },
      {
        protocol: 'https',
        hostname: 'radikal.host',
      },
      {
        protocol: 'https',
        hostname: 'radikal.click',
      },
      {
        protocol: 'https',
        hostname: 'radikal.site',
      },
      {
        protocol: 'https',
        hostname: '*.radikal.ru',
      },
      {
        protocol: 'https',
        hostname: '*.radikal.cloud',
      },
      {
        protocol: 'https',
        hostname: '*.radikal.host',
      },
      {
        protocol: 'https',
        hostname: '*.radikal.click',
      },
      {
        protocol: 'https',
        hostname: '*.radikal.site',
      },
      {
        protocol: 'https',
        hostname: '*.radika1.link',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
    ],
  },
  // Настройки кэширования
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
      // Заголовки кэширования для статических ресурсов
      {
        source: '/fonts/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable', // 1 год для шрифтов
          },
        ],
      },
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable', // 1 год для изображений
          },
        ],
      },
      {
        source: '/(.*)', // Применяем к остальным маршрутам
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
        // Исключаем API маршруты
        missing: [
          {
            type: 'header',
            key: 'content-type',
            value: 'application/json',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
