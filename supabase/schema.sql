-- Таблица категорий (разделов)
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    image_url TEXT,
    sort_order INTEGER DEFAULT 0
);

-- Таблица групп баннеров
CREATE TABLE IF NOT EXISTS banner_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    position INTEGER DEFAULT 0
);

-- Таблица баннеров
CREATE TABLE IF NOT EXISTS banners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES banner_groups(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    link_url TEXT,
    sort_order INTEGER DEFAULT 0
);

-- Таблица продуктов
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL
);

-- Таблица изображений продуктов
CREATE TABLE IF NOT EXISTS product_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_main BOOLEAN DEFAULT FALSE
);

-- Таблица характеристик продуктов
CREATE TABLE IF NOT EXISTS product_specs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    property_name VARCHAR(255) NOT NULL,
    value TEXT NOT NULL
);

-- Таблица пользователей для админ-панели
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица настроек сайта
CREATE TABLE IF NOT EXISTS site_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value TEXT
);

-- Таблица для хранения общих настроек сайта
CREATE TABLE IF NOT EXISTS general_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    site_title TEXT DEFAULT 'Каталог',
    site_icon TEXT DEFAULT '/favicon.ico',
    site_footer_info TEXT DEFAULT '© 2026 Каталог. Все права защищены.',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание триггера для автоматического обновления поля updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Применение триггера к таблице general_settings
CREATE TRIGGER update_general_settings_updated_at
    BEFORE UPDATE ON general_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Включение RLS для таблицы general_settings
ALTER TABLE general_settings ENABLE ROW LEVEL SECURITY;

-- Создание политики: только аутентифицированные пользователи с ролью admin могут управлять настройками
CREATE POLICY "Admin can manage general settings" ON general_settings
FOR ALL TO authenticated
USING (
  auth.jwt() ->> 'role' = 'admin' OR
  auth.jwt() -> 'user_metadata' ->> 'role' = 'admin' OR
  auth.jwt() -> 'user_metadata' ->> 'role' = 'super_admin'
);

-- Вставка начальной записи, если таблица пуста
INSERT INTO general_settings (id)
SELECT gen_random_uuid()
WHERE NOT EXISTS (SELECT 1 FROM general_settings);

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_banners_group_id ON banners(group_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_specs_product_id ON product_specs(product_id);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_banners_sort_order ON banners(sort_order);
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- Функция для проверки пароля администратора
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

    -- Проверка, существует ли пользователь и верен ли пароль
    IF user_record IS NOT NULL THEN
        -- Используем встроенную функцию Supabase для проверки хеша пароля
        SELECT COALESCE(crypt(input_password, user_record.password_hash), '') = user_record.password_hash INTO is_valid;
    END IF;

    -- Возвращаем результат
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