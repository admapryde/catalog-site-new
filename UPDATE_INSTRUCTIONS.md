# Обновления для репозитория catalog-site-new

## Основные изменения

### 1. Исправление ошибки "Maximum update depth exceeded"

#### Проблема
При работе с фильтрами товаров возникала ошибка:
```
Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render.
```

#### Решение
- Убраны `JSON.stringify` из зависимостей `useEffect` в `ProductFilters.tsx`
- Добавлен `debounce` для `onFilterChange` с задержкой 300мс
- Использованы `useRef` для отслеживания первого рендера и текущей категории
- Обновление внутреннего состояния теперь происходит только при первой загрузке или смене категории
- Добавлены `useCallback` и `useMemo` для оптимизации производительности

#### Файлы изменены
- `src/components/ProductFilters.tsx`
- `src/components/ProductsGridContent.tsx`
- `src/utils/debounce.ts` (новый файл)

### 2. Исправление ошибок TypeScript

#### Проблема
При сборке проекта возникали ошибки TypeScript в нескольких файлах

#### Решение
- Исправлены ошибки в API маршрутах с `supabaseWithRetry`
- Исправлены компоненты `FileUpload`, которые ожидали массив строк вместо одной строки
- Исправлен импорт `notFound` в `app/[...slug]/page.tsx`

#### Файлы изменены
- `app/[...slug]/page.tsx`
- `app/api/admin/page-block-images/route.ts`
- `app/api/admin/page-block-links/route.ts`
- `app/api/admin/page-blocks/route.ts`
- `app/api/admin/pages-with-data/route.ts`
- `scripts/set-user-role.ts`
- `src/components/PageRenderer.tsx`
- `src/components/admin/BannerManager.tsx`
- `src/components/admin/ProductsManager.tsx`
- `src/components/admin/CategoriesManager.tsx`
- `src/components/admin/PagesManager.tsx`
- `src/components/admin/GeneralSettingsForm.tsx`

### 3. Дополнительные улучшения

- Обновлен `.gitignore` для игнорирования временных и вспомогательных файлов
- Улучшена структура зависимостей и обработка ошибок
- Повышена производительность компонентов за счет оптимизаций

## Как протестировать

1. Запустить приложение: `npm run dev`
2. Перейти в любую категорию товаров
3. Выбрать любой фильтр чек-бокс
4. Перейти на страницу `/catalog`
5. В фильтрах выбрать ту же категорию, что была выбрана в шаге 2
6. Убедиться, что фильтры не мерцают и нет ошибок в консоли

## Сборка проекта

Проект успешно собирается командой `npm run build` без ошибок.