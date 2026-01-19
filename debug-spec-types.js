// Простой скрипт для проверки наличия типов характеристик в базе данных
const { createClient } = require('@supabase/supabase-js');

// Получаем переменные окружения
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Необходимо задать переменные окружения NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugSpecTypes() {
  try {
    console.log('Подключение к базе данных...');
    
    // Проверяем, существует ли таблица spec_types
    const { data: tables, error: tableError } = await supabase
      .from('spec_types')
      .select('*')
      .limit(1);

    if (tableError && tableError.code === '42P01') {
      console.log('Таблица spec_types не существует');
      return;
    } else if (tableError) {
      console.log('Ошибка при проверке таблицы spec_types:', tableError);
      return;
    }

    console.log('Таблица spec_types существует');

    // Получаем все типы характеристик
    const { data: specTypes, error: specTypesError } = await supabase
      .from('spec_types')
      .select('*');

    if (specTypesError) {
      console.log('Ошибка при получении типов характеристик:', specTypesError);
      return;
    }

    console.log('Найдено типов характеристик:', specTypes.length);
    if (specTypes.length > 0) {
      console.log('Типы характеристик:');
      specTypes.forEach(type => {
        console.log(`- ${type.name} (${type.filter_type}), category_id: ${type.category_id}`);
      });
    } else {
      console.log('Типы характеристик отсутствуют в базе данных');
      console.log('Запуск миграции для создания типов характеристик...');
      
      // Попробуем запустить миграцию
      const migrationResult = await runMigration();
      console.log('Результат миграции:', migrationResult);
    }
  } catch (error) {
    console.error('Ошибка при отладке типов характеристик:', error);
  }
}

async function runMigration() {
  // Выполняем SQL-запрос для создания таблицы и добавления типов характеристик
  const sql = `
    -- Проверяем, существует ли таблица spec_types
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='spec_types') THEN
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
  `;
  
  // Так как мы не можем выполнить такой большой блок напрямую через Supabase JS клиента,
  // пользователю нужно будет выполнить миграцию вручную или через Supabase Studio
  
  return "Миграцию нужно выполнить вручную через Supabase Studio или CLI";
}

debugSpecTypes();