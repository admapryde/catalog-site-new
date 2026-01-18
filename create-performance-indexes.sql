-- Индексы для таблицы categories
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_created_at ON categories(created_at);

-- Индексы для таблицы products
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name); -- Для поиска по названию

-- Индексы для таблицы product_images
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_is_main ON product_images(is_main);

-- Индексы для таблицы product_specs
CREATE INDEX IF NOT EXISTS idx_product_specs_product_id ON product_specs(product_id);

-- Индексы для таблицы banners
CREATE INDEX IF NOT EXISTS idx_banners_group_id ON banners(group_id);
CREATE INDEX IF NOT EXISTS idx_banners_sort_order ON banners(sort_order);

-- Индексы для таблицы homepage_section_items
CREATE INDEX IF NOT EXISTS idx_homepage_section_items_section_id ON homepage_section_items(section_id);
CREATE INDEX IF NOT EXISTS idx_homepage_section_items_product_id ON homepage_section_items(product_id);
CREATE INDEX IF NOT EXISTS idx_homepage_section_items_sort_order ON homepage_section_items(sort_order);