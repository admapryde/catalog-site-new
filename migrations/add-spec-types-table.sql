-- Миграция: добавление таблицы типов характеристик и обновление связей

-- Создание таблицы типов характеристик
CREATE TABLE IF NOT EXISTS spec_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    filter_type VARCHAR(20) NOT NULL, -- SELECT, CHECKBOXES, RADIO, RANGE
    data_type VARCHAR(20) NOT NULL,   -- TEXT, NUMBER, BOOLEAN
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Добавление столбца для связи с типами характеристик
ALTER TABLE product_specs ADD COLUMN IF NOT EXISTS spec_type_id UUID REFERENCES spec_types(id) ON DELETE SET NULL;

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_product_specs_spec_type_id ON product_specs(spec_type_id);
CREATE INDEX IF NOT EXISTS idx_spec_types_category_id ON spec_types(category_id);
CREATE INDEX IF NOT EXISTS idx_spec_types_name ON spec_types(name);