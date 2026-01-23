# Коммиты для репозитория catalog-site-new

## Коммит 1: Исправление ошибки "Maximum update depth exceeded" в ProductFilters

- Убраны JSON.stringify из зависимостей useEffect
- Добавлен debounce для onFilterChange
- Оптимизировано обновление initialFilters
- Добавлены useCallback и useMemo для производительности

Файлы:
- src/components/ProductFilters.tsx
- src/components/ProductsGridContent.tsx
- src/utils/debounce.ts

## Коммит 2: Исправление ошибок TypeScript в API маршрутах

- Исправлены ошибки в API маршрутах с supabaseWithRetry
- Обновлены типы для корректной работы с Supabase

Файлы:
- app/api/admin/page-block-images/route.ts
- app/api/admin/page-block-links/route.ts
- app/api/admin/page-blocks/route.ts
- app/api/admin/pages-with-data/route.ts

## Коммит 3: Исправление компонентов FileUpload

- Исправлены компоненты FileUpload для корректной обработки массива строк
- Обновлены соответствующие обработчики в BannerManager, ProductsManager, CategoriesManager, GeneralSettingsForm

Файлы:
- src/components/admin/BannerManager.tsx
- src/components/admin/ProductsManager.tsx
- src/components/admin/CategoriesManager.tsx
- src/components/admin/GeneralSettingsForm.tsx
- src/components/admin/FileUpload.tsx

## Коммит 4: Другие исправления TypeScript

- Исправлен импорт notFound в app/[...slug]/page.tsx
- Исправлены ошибки в scripts/set-user-role.ts
- Исправлены ошибки в src/components/PageRenderer.tsx
- Обновлены типы в других компонентах

Файлы:
- app/[...slug]/page.tsx
- scripts/set-user-role.ts
- src/components/PageRenderer.tsx
- src/components/admin/PagesManager.tsx

## Коммит 5: Обновление .gitignore

- Добавлены правила для игнорирования временных и вспомогательных файлов
- Обновлены исключения для build artifacts и локальных конфигураций