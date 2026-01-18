-- Таблица для разделов ГС
CREATE TABLE homepage_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  position INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица для связи товаров с разделами ГС
CREATE TABLE homepage_section_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID REFERENCES homepage_sections(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Уникальный индекс для предотвращения дубликатов
CREATE UNIQUE INDEX idx_homepage_section_items_unique ON homepage_section_items(section_id, product_id);

-- Индексы для производительности
CREATE INDEX idx_homepage_section_items_section ON homepage_section_items(section_id);
CREATE INDEX idx_homepage_section_items_product ON homepage_section_items(product_id);