# Инструкция по выполнению миграции базы данных

Для корректной работы функционала изменения порядка товаров в категории необходимо выполнить следующие шаги:

## 1. Создание таблицы category_product_order

Выполните SQL-скрипт из файла `migrations/001_create_category_product_order_table.sql` в вашей базе данных Supabase.

Вы можете выполнить его в SQL-редакторе Supabase (Database -> SQL Editor):

```sql
-- Создание таблицы для хранения порядка товаров в категории
CREATE TABLE IF NOT EXISTS category_product_order (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category_id, product_id)
);

-- Индекс для ускорения поиска по категории
CREATE INDEX IF NOT EXISTS idx_category_product_order_category_id ON category_product_order(category_id);

-- Индекс для ускорения поиска по товару
CREATE INDEX IF NOT EXISTS idx_category_product_order_product_id ON category_product_order(product_id);

-- Триггер для обновления времени обновления
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_category_product_order_updated_at
    BEFORE UPDATE ON category_product_order
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## 2. Включение RLS политик (Row Level Security)

После создания таблицы необходимо включить и настроить RLS политики для обеспечения безопасности данных. Выполните SQL-скрипт из файла `migrations/002_enable_category_product_order_rls.sql` в SQL-редакторе Supabase:

```sql
-- Включаем RLS для таблицы category_product_order
ALTER TABLE category_product_order ENABLE ROW LEVEL SECURITY;

-- Политика для аутентифицированных пользователей (разрешаем все операции)
DROP POLICY IF EXISTS "category_product_order_authenticated_users" ON category_product_order;
CREATE POLICY "category_product_order_authenticated_users" ON category_product_order
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Политика для service_role (разрешаем все операции)
DROP POLICY IF EXISTS "category_product_order_service_role" ON category_product_order;
CREATE POLICY "category_product_order_service_role" ON category_product_order
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- Политика для anon (разрешаем только SELECT)
DROP POLICY IF EXISTS "category_product_order_anon_select" ON category_product_order;
CREATE POLICY "category_product_order_anon_select" ON category_product_order
FOR SELECT TO anon
USING (true);
```

## 3. Проверка

После выполнения миграции убедитесь, что таблица создана:
- Перейдите в Database -> Tables в Supabase
- Найдите таблицу `category_product_order`

## 4. Тестирование

После создания таблицы и настройки RLS политик функционал изменения порядка товаров в категории должен работать корректно:
- Перейдите на страницу `/admin/products`
- Раскройте нужную категорию
- Нажмите "Изменить порядок"
- Переместите товары с помощью стрелок
- Нажмите "Сохранить изменения"

## 5. Обновление кэша (при необходимости)

Если возникнут проблемы с отображением изменений в каталоге, возможно, потребуется очистить кэш:
- Перезапустите приложение или
- Очистите кэш в Supabase (Database -> Settings -> Clear Cache)