# Furniture Catalog Website

This is a furniture catalog website built with [Next.js](https://nextjs.org) and integrated with Supabase for data management, Cloudinary for image storage and processing, and beautiful typography with PT Sans and Jost fonts from Google Fonts.

## Features

- **Modern UI/UX**: Responsive design optimized for all devices
- **Admin Panel**: Full-featured admin interface for managing content
- **Real-time Data**: Powered by Supabase PostgreSQL database
- **Image Management**: Cloudinary integration for optimized image delivery
- **Performance Optimized**: Caching, lazy loading, and optimized rendering
- **Audit System**: Comprehensive logging of all administrative actions
- **Authentication**: Secure admin authentication system
- **Dynamic Site Settings**: Server-side metadata handling for site title and favicon
- **Efficient Caching**: Smart caching with invalidation for site settings
- **Admin Configurable**: Title, favicon, and footer info editable via admin panel

## Tech Stack

- **Framework**: Next.js 16.1.1
- **Runtime**: React 19.2.3
- **Database**: Supabase (PostgreSQL)
- **Image Processing**: Cloudinary
- **Styling**: Tailwind CSS
- **Authentication**: Custom admin authentication
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites

Before running the application, you need to set up your Supabase and Cloudinary accounts and configure the environment variables.

1. Create a Supabase account at [https://supabase.com](https://supabase.com)
2. Create a new project in your Supabase dashboard
3. Create a Cloudinary account at [https://cloudinary.com](https://cloudinary.com)

### Database Schema

Create the following tables in your Supabase database:

#### Categories table
```sql
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  image_url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);
```

#### Banner Groups table
```sql
CREATE TABLE banner_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  position INTEGER DEFAULT 1
);
```

#### Banners table
```sql
CREATE TABLE banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES banner_groups(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  link_url TEXT,
  sort_order INTEGER DEFAULT 0
);
```

#### Products table
```sql
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  price INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Product Images table
```sql
CREATE TABLE product_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_main BOOLEAN DEFAULT FALSE
);
```

#### Product Specifications table
```sql
CREATE TABLE product_specs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  property_name VARCHAR(255) NOT NULL,
  value TEXT NOT NULL,
  spec_type_id UUID REFERENCES spec_types(id) ON DELETE SET NULL
);
```

#### Specification Types table
```sql
CREATE TABLE spec_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  filter_type VARCHAR(20) NOT NULL, -- SELECT, CHECKBOXES, RADIO, RANGE
  data_type VARCHAR(20) NOT NULL,   -- TEXT, NUMBER, BOOLEAN
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Admin Users table
```sql
-- Create the admin_users table
CREATE TABLE admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for improved performance
CREATE INDEX idx_admin_users_username ON admin_users(username);
CREATE INDEX idx_admin_users_email ON admin_users(email);

-- Create function to verify admin passwords
CREATE OR REPLACE FUNCTION verify_admin_password(input_username TEXT, input_password TEXT)
RETURNS TABLE(match_found BOOLEAN, user_data JSON)
LANGUAGE plpgsql
AS $$
DECLARE
    user_record RECORD;
    is_valid BOOLEAN := FALSE;
BEGIN
    -- Search for user by username
    SELECT * INTO user_record FROM admin_users WHERE username = input_username;

    -- Check if user exists and password is correct
    IF user_record IS NOT NULL THEN
        -- Use built-in Supabase function to check password hash
        SELECT COALESCE(crypt(input_password, user_record.password_hash), '') = user_record.password_hash INTO is_valid;
    END IF;

    -- Return result
    RETURN QUERY
    SELECT is_valid AS match_found,
           CASE
             WHEN is_valid THEN
               json_build_object(
                 'id', user_record.id,
                 'username', user_record.username,
                 'email', user_record.email,
                 'role', user_record.role
               )
             ELSE NULL
           END AS user_data;
END;
$$;
```

#### Audit Log table
```sql
-- Create audit log table to track all administrative actions
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT NOT NULL,
  object_type VARCHAR(50) NOT NULL,
  object_id UUID,
  action VARCHAR(20) CHECK (action IN ('Создан', 'Отредактирован', 'Удалён')),
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Environment Variables

Create a `.env.local` file in the root of your project and add your Supabase and Cloudinary credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
AUTH_SECRET=your_auth_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Running the Development Server

First, install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Admin Panel

Access the admin panel at [http://localhost:3000/admin](http://localhost:3000/admin) using your administrator credentials.

### Setting Up Administrator Accounts

To add your first administrator, insert a record into the admin_users table:

```sql
-- Add an administrator user (username: admin, password: admin123)
INSERT INTO admin_users (username, email, password_hash, role)
VALUES ('admin', 'admin@example.com', crypt('admin123', gen_salt('bf')), 'admin');
```

From the admin panel, you can manage:
- Categories
- Banner groups and banners
- Products
- View audit history of all administrative actions

### Authentication

The admin panel is protected by custom authentication middleware. All routes starting with `/admin` are protected and require a valid admin session. Sessions are valid for 24 hours.

## Audit System

The application includes a comprehensive audit system that tracks all administrative actions:

### Supported Object Types:
- `sections` - Section
- `banner_groups` - Banner Group
- `banners` - Banner
- `home_sections` - Home Section
- `products` - Product
- `categories` - Category
- `users` - User
- `admin_access` - Admin Access
- `pages` - Page
- `page_blocks` - Page Block
- `page_block_images` - Page Block Image
- `page_block_links` - Page Block Link

### Audit History Dashboard

The admin panel includes an audit history dashboard accessible at `/admin/audit-history` with filtering capabilities:
- Limit: number of records per page (default 50)
- Offset: pagination offset
- Object Type: filter by object type
- Action: filter by action type
- Date Range: filter by date range

## Performance Optimization

The application includes several performance optimizations:

- **Multi-level caching**: Client-side and server-side caching
- **Parallel requests**: Improved loading times through parallel API calls
- **Image optimization**: Next.js Image component with optimized delivery
- **Component optimization**: Eliminated circular imports and improved rendering
- **API route optimization**: Added caching headers and improved error handling

### Cache Configuration
- Categories: 5 minutes (300 seconds)
- Products: 5 minutes (300 seconds)
- Banners: 5 minutes (300 seconds)
- Search results: 3 minutes (180 seconds)

## Deployment

### Vercel Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

#### Deployment Steps:

1. Push your code to a GitHub, GitLab, or Bitbucket repository
2. Sign up for a Vercel account at [https://vercel.com](https://vercel.com)
3. Import your project from the repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `AUTH_SECRET`
5. Deploy

#### Free Plan Limitations:
- Serverless Functions: up to 1000 hours per month
- Bandwidth: up to 100 GB per month
- Deployments: unlimited
- Custom Domains: up to 3 domains

## Scripts

The project includes several useful scripts:

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test:supabase` - Test Supabase connection
- `npm run test:cloudinary` - Test Cloudinary connection
- `npm run db:add-missing` - Add missing data
- `npm run db:seed-admin` - Seed admin user
- `npm run cache:clear` - Clear cache

## Security

- **Input validation**: All inputs are validated before processing
- **Authentication**: Protected routes with session validation
- **SQL Injection Prevention**: Using parameterized queries
- **Secure Headers**: X-Content-Type-Options, X-Frame-Options, XSS protection
- **Password Hashing**: Using bcrypt for secure password storage

## Troubleshooting

### Common Issues:

1. **Data not saving**: Check that Supabase credentials are correctly set in `.env.local`
2. **Connection errors**: Verify that Project URL and anon key are copied correctly
3. **Images not displaying**: Check that image URLs are added to `remotePatterns` in `next.config.ts`
4. **Slow loading**: Ensure caching is properly configured

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

---

# Веб-сайт каталога мебели

Это веб-сайт каталога мебели, созданный с использованием [Next.js](https://nextjs.org) и интегрированный с Supabase для управления данными, Cloudinary для хранения и обработки изображений, а также красивым типографикой с шрифтами PT Sans и Jost от Google Fonts.

## Особенности

- **Современный UI/UX**: Адаптивный дизайн, оптимизированный для всех устройств
- **Административная панель**: Полнофункциональный интерфейс администратора для управления контентом
- **Данные в реальном времени**: Работает на базе данных Supabase PostgreSQL
- **Управление изображениями**: Интеграция с Cloudinary для оптимизированной доставки изображений
- **Оптимизированная производительность**: Кэширование, отложенная загрузка и оптимизированный рендеринг
- **Система аудита**: Комплексное логирование всех административных действий
- **Аутентификация**: Безопасная система аутентификации администратора
- **Динамические настройки сайта**: Обработка метаданных на стороне сервера для заголовка сайта и favicon
- **Эффективное кэширование**: Умное кэширование с инвалидацией для настроек сайта
- **Настраиваемые параметры**: Заголовок, иконка и информация в футере редактируются через админ-панель

## Технологический стек

- **Фреймворк**: Next.js 16.1.1
- **Среда выполнения**: React 19.2.3
- **База данных**: Supabase (PostgreSQL)
- **Обработка изображений**: Cloudinary
- **Стилизация**: Tailwind CSS
- **Аутентификация**: Пользовательская аутентификация администратора
- **Развертывание**: Готово к Vercel

## Начало работы

### Предварительные требования

Перед запуском приложения необходимо настроить учетные записи Supabase и Cloudinary и настроить переменные окружения.

1. Создайте учетную запись Supabase на [https://supabase.com](https://supabase.com)
2. Создайте новый проект на панели управления Supabase
3. Создайте учетную запись Cloudinary на [https://cloudinary.com](https://cloudinary.com)

### Схема базы данных

Создайте следующие таблицы в вашей базе данных Supabase:

#### Таблица категорий
```sql
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  image_url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);
```

#### Таблица групп баннеров
```sql
CREATE TABLE banner_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  position INTEGER DEFAULT 1
);
```

#### Таблица баннеров
```sql
CREATE TABLE banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES banner_groups(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  link_url TEXT,
  sort_order INTEGER DEFAULT 0
);
```

#### Таблица продуктов
```sql
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  price INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Таблица изображений продукта
```sql
CREATE TABLE product_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_main BOOLEAN DEFAULT FALSE
);
```

#### Таблица характеристик продукта
```sql
CREATE TABLE product_specs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  property_name VARCHAR(255) NOT NULL,
  value TEXT NOT NULL,
  spec_type_id UUID REFERENCES spec_types(id) ON DELETE SET NULL
);
```

#### Таблица типов характеристик
```sql
CREATE TABLE spec_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  filter_type VARCHAR(20) NOT NULL, -- SELECT, CHECKBOXES, RADIO, RANGE
  data_type VARCHAR(20) NOT NULL,   -- TEXT, NUMBER, BOOLEAN
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Таблица пользователей администратора
```sql
-- Создать таблицу admin_users
CREATE TABLE admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создать индексы для повышения производительности
CREATE INDEX idx_admin_users_username ON admin_users(username);
CREATE INDEX idx_admin_users_email ON admin_users(email);

-- Создать функцию для проверки паролей администратора
CREATE OR REPLACE FUNCTION verify_admin_password(input_username TEXT, input_password TEXT)
RETURNS TABLE(match_found BOOLEAN, user_data JSON)
LANGUAGE plpgsql
AS $$
DECLARE
    user_record RECORD;
    is_valid BOOLEAN := FALSE;
BEGIN
    -- Поиск пользователя по имени пользователя
    SELECT * INTO user_record FROM admin_users WHERE username = input_username;

    -- Проверка существования пользователя и правильности пароля
    IF user_record IS NOT NULL THEN
        -- Использовать встроенную функцию Supabase для проверки хеша пароля
        SELECT COALESCE(crypt(input_password, user_record.password_hash), '') = user_record.password_hash INTO is_valid;
    END IF;

    -- Возврат результата
    RETURN QUERY
    SELECT is_valid AS match_found,
           CASE
             WHEN is_valid THEN
               json_build_object(
                 'id', user_record.id,
                 'username', user_record.username,
                 'email', user_record.email,
                 'role', user_record.role
               )
             ELSE NULL
           END AS user_data;
END;
$$;
```

#### Таблица журнала аудита
```sql
-- Создать таблицу журнала аудита для отслеживания всех административных действий
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT NOT NULL,
  object_type VARCHAR(50) NOT NULL,
  object_id UUID,
  action VARCHAR(20) CHECK (action IN ('Создан', 'Отредактирован', 'Удалён')),
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Переменные окружения

Создайте файл `.env.local` в корне вашего проекта и добавьте учетные данные Supabase и Cloudinary:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
AUTH_SECRET=your_auth_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Запуск сервера разработки

Сначала установите зависимости:

```bash
npm install
# или
yarn install
# или
pnpm install
# или
bun install
```

Затем запустите сервер разработки:

```bash
npm run dev
# или
yarn dev
# или
pnpm dev
# или
bun dev
```

Откройте [http://localhost:3000](http://localhost:3000) в вашем браузере, чтобы увидеть результат.

## Административная панель

Доступ к административной панели осуществляется по адресу [http://localhost:3000/admin](http://localhost:3000/admin) с использованием учетных данных администратора.

### Настройка учетных записей администратора

Чтобы добавить первого администратора, вставьте запись в таблицу admin_users:

```sql
-- Добавить пользователя-администратора (имя пользователя: admin, пароль: admin123)
INSERT INTO admin_users (username, email, password_hash, role)
VALUES ('admin', 'admin@example.com', crypt('admin123', gen_salt('bf')), 'admin');
```

Из административной панели вы можете управлять:
- Категориями
- Группами баннеров и баннерами
- Продуктами
- Просмотром истории аудита всех административных действий

### Аутентификация

Административная панель защищена пользовательским промежуточным программным обеспечением аутентификации. Все маршруты, начинающиеся с `/admin`, защищены и требуют действительного сеанса администратора. Сеансы действительны в течение 24 часов.

## Система аудита

Приложение включает комплексную систему аудита, которая отслеживает все административные действия:

### Поддерживаемые типы объектов:
- `sections` - Раздел
- `banner_groups` - Группа баннеров
- `banners` - Баннер
- `home_sections` - Раздел главной страницы
- `products` - Продукт
- `categories` - Категория
- `users` - Пользователь
- `admin_access` - Доступ администратора
- `pages` - Страница
- `page_blocks` - Блок страницы
- `page_block_images` - Изображение блока страницы
- `page_block_links` - Ссылка блока страницы

### Панель истории аудита

Административная панель включает панель истории аудита, доступную по адресу `/admin/audit-history` с возможностями фильтрации:
- Лимит: количество записей на странице (по умолчанию 50)
- Смещение: смещение для пагинации
- Тип объекта: фильтр по типу объекта
- Действие: фильтр по типу действия
- Диапазон дат: фильтр по диапазону дат

## Оптимизация производительности

Приложение включает несколько оптимизаций производительности:

- **Многоуровневое кэширование**: Кэширование на стороне клиента и сервера
- **Параллельные запросы**: Улучшенное время загрузки за счет параллельных вызовов API
- **Оптимизация изображений**: Компонент Next.js Image с оптимизированной доставкой
- **Оптимизация компонентов**: Устранение циклических импортов и улучшенный рендеринг
- **Оптимизация маршрутов API**: Добавлены заголовки кэширования и улучшена обработка ошибок

### Конфигурация кэширования
- Категории: 5 минут (300 секунд)
- Продукты: 5 минут (300 секунд)
- Баннеры: 5 минут (300 секунд)
- Результаты поиска: 3 минуты (180 секунд)

## Развертывание

### Развертывание на Vercel

Самый простой способ развернуть ваше приложение Next.js - использовать [платформу Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) от создателей Next.js.

#### Шаги развертывания:

1. Загрузите ваш код в репозиторий GitHub, GitLab или Bitbucket
2. Зарегистрируйтесь в аккаунте Vercel на [https://vercel.com](https://vercel.com)
3. Импортируйте ваш проект из репозитория
4. Добавьте переменные окружения:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `AUTH_SECRET`
5. Разверните

#### Ограничения бесплатного плана:
- Серверные функции: до 1000 часов в месяц
- Пропускная способность: до 100 ГБ в месяц
- Развертывания: неограниченные
- Пользовательские домены: до 3 доменов

## Скрипты

Проект включает несколько полезных скриптов:

- `npm run dev` - Запуск сервера разработки
- `npm run build` - Сборка для производства
- `npm run start` - Запуск сервера производства
- `npm run lint` - Запуск ESLint
- `npm run test:supabase` - Тестирование подключения к Supabase
- `npm run test:cloudinary` - Тестирование подключения к Cloudinary
- `npm run db:add-missing` - Добавление отсутствующих данных
- `npm run db:seed-admin` - Заполнение пользователя-администратора
- `npm run cache:clear` - Очистка кэша

## Безопасность

- **Проверка ввода**: Все входные данные проверяются перед обработкой
- **Аутентификация**: Защищенные маршруты с проверкой сеанса
- **Предотвращение SQL-инъекций**: Использование параметризованных запросов
- **Безопасные заголовки**: X-Content-Type-Options, X-Frame-Options, защита XSS
- **Хеширование паролей**: Использование bcrypt для безопасного хранения паролей

## Устранение неполадок

### Распространенные проблемы:

1. **Данные не сохраняются**: Проверьте, правильно ли заданы учетные данные Supabase в `.env.local`
2. **Ошибки подключения**: Убедитесь, что URL-адрес проекта и anon key скопированы правильно
3. **Изображения не отображаются**: Проверьте, добавлены ли URL-адреса изображений в `remotePatterns` в `next.config.ts`
4. **Медленная загрузка**: Убедитесь, что кэширование настроено должным образом

## Вклад в развитие

1. Сделайте форк репозитория
2. Создайте ветку функции (`git checkout -b feature/amazing-feature`)
3. Зафиксируйте свои изменения (`git commit -m 'Add amazing feature'`)
4. Отправьте в ветку (`git push origin feature/amazing-feature`)
5. Откройте запрос на слияние

## Лицензия

Этот проект лицензирован по лицензии MIT.