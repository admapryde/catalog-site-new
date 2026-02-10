# Документация к API веб-сайта каталога товаров

## Обзор

Этот документ описывает API веб-сайта каталога товаров, построенного на основе Next.js и Supabase. API предоставляет функциональность для работы с товарами, категориями, изображениями, характеристиками и другими элементами каталога.

## Базовый URL

API доступен по адресу: `/api`

## Аутентификация

### Публичные маршруты
Для публичных маршрутов аутентификация не требуется.

### Административные маршруты
Для административных маршрутов (начинающихся с `/api/admin`) требуется аутентификация администратора. Аутентификация осуществляется через Supabase Auth.

#### Вход
```
POST /api/auth/login
```

**Тело запроса:**
```json
{
  "email": "admin@example.com",
  "password": "password"
}
```

**Ответ:**
```json
{
  "success": true,
  "user": {
    "id": "user-id",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

#### Выход
```
POST /api/logout
```

**Ответ:**
```json
{
  "ok": true,
  "url": "/login"
}
```

## Публичные маршруты

### Товары

#### Получение списка товаров
```
GET /api/products
```

**Параметры запроса:**
- `category_id` (опционально) - ID категории для фильтрации
- `search` (опционально) - строка поиска по названию товара
- `price_from` (опционально) - минимальная цена
- `price_to` (опционально) - максимальная цена
- `limit` (опционально) - количество результатов (по умолчанию 100, максимум 1000)
- `offset` (опционально) - смещение для пагинации
- `spec_{property_name}` (опционально) - фильтр по характеристикам (например, `spec_color=red,blue`)

**Ответ:**
```json
[
  {
    "id": "product-id",
    "name": "Название товара",
    "price": 1000,
    "description": "Описание товара",
    "category": {
      "id": "category-id",
      "name": "Название категории"
    },
    "images": [
      {
        "id": "image-id",
        "image_url": "https://example.com/image.jpg",
        "is_main": true
      }
    ],
    "specs": [
      {
        "id": "spec-id",
        "property_name": "Цвет",
        "value": "Красный",
        "spec_type_id": "type-id"
      }
    ],
    "category_product_order": {
      "category_id": "category-id",
      "product_id": "product-id",
      "sort_order": 1
    },
    "created_at": "2023-01-01T00:00:00Z"
  }
]
```

**Заголовки ответа:**
- `X-Total-Count` - общее количество товаров
- `X-Limit` - лимит на количество результатов
- `X-Offset` - смещение
- `X-Next-Cache-Tags` - теги кэширования
- `Cache-Control` - настройки кэширования

### Категории

#### Получение списка категорий
```
GET /api/categories
```

**Ответ:**
```json
[
  {
    "id": "category-id",
    "name": "Название категории",
    "image_url": "https://example.com/category-image.jpg",
    "sort_order": 1
  }
]
```

### Поиск

#### Поиск по товарам и категориям
```
GET /api/search
```

**Параметры запроса:**
- `q` или `search` - строка поиска

**Ответ:**
```json
{
  "products": [
    {
      "id": "product-id",
      "name": "Название товара",
      "price": 1000,
      "category": {
        "id": "category-id",
        "name": "Название категории"
      }
    }
  ],
  "categories": [
    {
      "id": "category-id",
      "name": "Название категории"
    }
  ]
}
```

### Настройки

#### Получение настроек заголовка
```
GET /api/header-settings
```

#### Получение настроек подвала
```
GET /api/footer-settings
```

#### Получение общих настроек
```
GET /api/general-settings
```

#### Получение баннеров
```
GET /api/banners
```

#### Получение структуры главной страницы
```
GET /api/homepage-structure
```

#### Получение разделов главной страницы
```
GET /api/homepage-sections
```

### Страницы

#### Получение публичных страниц
```
GET /api/public-pages/{slug}
```

## Административные маршруты

Для всех административных маршрутов требуется аутентификация администратора.

### Товары

#### Получение списка товаров (административный)
```
GET /api/admin/products
```

**Параметры запроса:**
- `category_id` (опционально) - ID категории для фильтрации

**Ответ:**
```json
[
  {
    "id": "product-id",
    "name": "Название товара",
    "price": 1000,
    "description": "Описание товара",
    "category_id": "category-id",
    "category": {
      "id": "category-id",
      "name": "Название категории"
    },
    "images": [
      {
        "id": "image-id",
        "image_url": "https://example.com/image.jpg",
        "is_main": true,
        "product_id": "product-id"
      }
    ],
    "specs": [
      {
        "id": "spec-id",
        "product_id": "product-id",
        "property_name": "Цвет",
        "value": "Красный",
        "spec_type_id": "type-id",
        "spec_type": {
          "id": "type-id",
          "name": "Тип характеристики",
          "filter_type": "checkbox"
        }
      }
    ],
    "category_product_order": {
      "category_id": "category-id",
      "product_id": "product-id",
      "sort_order": 1
    },
    "created_at": "2023-01-01T00:00:00Z"
  }
]
```

#### Создание товара
```
POST /api/admin/products
```

**Тело запроса:**
```json
{
  "category_id": "category-id",
  "name": "Название товара",
  "price": 1000,
  "description": "Описание товара",
  "images": [
    {
      "image_url": "https://example.com/image.jpg",
      "is_main": true
    }
  ],
  "specs": [
    {
      "property_name": "Цвет",
      "value": "Красный",
      "spec_type_id": "type-id"
    }
  ]
}
```

**Ответ:**
```json
{
  "id": "product-id",
  "name": "Название товара",
  "price": 1000,
  "description": "Описание товара",
  "category_id": "category-id",
  "category": {
    "id": "category-id",
    "name": "Название категории"
  },
  "images": [...],
  "specs": [...],
  "category_product_order": null,
  "created_at": "2023-01-01T00:00:00Z"
}
```

#### Обновление товара
```
PUT /api/admin/products
```

**Тело запроса:**
```json
{
  "id": "product-id",
  "category_id": "category-id",
  "name": "Обновленное название товара",
  "price": 1200,
  "description": "Обновленное описание товара",
  "images": [
    {
      "image_url": "https://example.com/new-image.jpg",
      "is_main": true
    }
  ],
  "specs": [
    {
      "property_name": "Цвет",
      "value": "Синий",
      "spec_type_id": "type-id"
    }
  ]
}
```

**Ответ:**
```json
{
  "id": "product-id",
  "name": "Обновленное название товара",
  "price": 1200,
  "description": "Обновленное описание товара",
  "category_id": "category-id",
  "category": {
    "id": "category-id",
    "name": "Название категории"
  },
  "images": [...],
  "specs": [...],
  "category_product_order": {
    "category_id": "category-id",
    "product_id": "product-id",
    "sort_order": 1
  },
  "created_at": "2023-01-01T00:00:00Z"
}
```

#### Удаление товара
```
DELETE /api/admin/products?id={product-id}
```

**Ответ:**
```json
{
  "success": true
}
```

### Категории

#### Получение списка категорий (административный)
```
GET /api/admin/categories
```

#### Создание категории
```
POST /api/admin/categories
```

**Тело запроса:**
```json
{
  "name": "Название категории",
  "image_url": "https://example.com/category-image.jpg",
  "sort_order": 1
}
```

#### Обновление категории
```
PUT /api/admin/categories
```

**Тело запроса:**
```json
{
  "id": "category-id",
  "name": "Обновленное название категории",
  "image_url": "https://example.com/new-category-image.jpg",
  "sort_order": 2
}
```

#### Удаление категории
```
DELETE /api/admin/categories?id={category-id}
```

### Изображения

#### Загрузка изображения
```
POST /api/upload
```

**Тело запроса (multipart/form-data):**
- `file` - файл изображения
- `folder` - папка для загрузки
- `isFavicon` - флаг, указывающий, что это favicon (опционально)

**Ответ:**
```json
{
  "url": "https://example.com/uploaded-image.jpg",
  "publicId": "folder/image_id",
  "format": "jpg",
  "bytes": 12345,
  "width": 800,
  "height": 600
}
```

### Статистика

#### Получение статистики (административный)
```
GET /api/admin/stats
```

**Ответ:**
```json
{
  "totalProducts": 100,
  "totalCategories": 10,
  "totalUsers": 50
}
```

### Аудит

#### Получение истории аудита (административный)
```
GET /api/admin/audit-history
```

## Обработка ошибок

Все ошибки возвращаются в следующем формате:
```json
{
  "error": "Описание ошибки"
}
```

## Кэширование

Некоторые маршруты используют кэширование для повышения производительности:
- Маршруты получения товаров и категорий кэшируются на 1-5 минут
- Заголовки кэширования включают `Cache-Control` и `X-Next-Cache-Tags`

## Безопасность

- Все административные маршруты защищены аутентификацией
- Используется Supabase Auth для управления сессиями
- Middleware проверяет права доступа к административным маршрутам
- Используется service role client для операций, требующих повышенных прав

## Технологии

- Next.js 16.1.1
- Supabase (PostgreSQL + Auth)
- Cloudinary (для хранения изображений)
- TypeScript

Документация создана на основе анализа исходного кода проекта.