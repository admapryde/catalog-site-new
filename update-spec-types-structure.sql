-- Скрипт для обновления структуры базы данных для типов характеристик

-- Проверяем, существует ли столбец spec_type_id в таблице product_specs
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='product_specs' AND column_name='spec_type_id') THEN
    ALTER TABLE product_specs ADD COLUMN spec_type_id UUID REFERENCES spec_types(id) ON DELETE SET NULL;
    RAISE NOTICE 'Добавлен столбец spec_type_id в таблицу product_specs';
  ELSE
    RAISE NOTICE 'Столбец spec_type_id уже существует в таблице product_specs';
  END IF;
END $$;

-- Проверяем, существует ли индекс для столбца spec_type_id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                 WHERE tablename='product_specs' AND indexname='idx_product_specs_spec_type_id') THEN
    CREATE INDEX idx_product_specs_spec_type_id ON product_specs(spec_type_id);
    RAISE NOTICE 'Создан индекс idx_product_specs_spec_type_id';
  ELSE
    RAISE NOTICE 'Индекс idx_product_specs_spec_type_id уже существует';
  END IF;
END $$;

-- Проверяем, существует ли таблица spec_types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                 WHERE table_name='spec_types') THEN
    CREATE TABLE spec_types (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      filter_type VARCHAR(20) NOT NULL, -- SELECT, CHECKBOXES, RADIO, RANGE
      data_type VARCHAR(20) NOT NULL,   -- TEXT, NUMBER, BOOLEAN
      category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Создаем индексы для таблицы spec_types
    CREATE INDEX idx_spec_types_category_id ON spec_types(category_id);
    CREATE INDEX idx_spec_types_name ON spec_types(name);
    
    RAISE NOTICE 'Создана таблица spec_types';
  ELSE
    RAISE NOTICE 'Таблица spec_types уже существует';
  END IF;
END $$;

-- Добавляем seed-данные для типов характеристик, если их нет
DO $$
DECLARE
  row_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO row_count FROM spec_types;
  
  IF row_count = 0 THEN
    INSERT INTO spec_types (name, filter_type, data_type, category_id) VALUES
    ('Диапазон', 'RANGE', 'NUMBER', NULL),
    ('Чек-бокс', 'CHECKBOXES', 'BOOLEAN', NULL),
    ('Радио', 'RADIO', 'TEXT', NULL),
    ('Выпадающий список', 'SELECT', 'TEXT', NULL);
    
    RAISE NOTICE 'Добавлены seed-данные для типов характеристик';
  ELSE
    RAISE NOTICE 'Типы характеристик уже существуют в базе данных';
  END IF;
END $$;