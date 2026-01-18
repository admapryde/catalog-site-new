-- Функция для автоматического логирования изменений в таблицах
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (user_id, user_name, object_type, object_id, action, created_at)
        VALUES (
            NEW.user_id, 
            COALESCE(NEW.name, NEW.title, NEW.label, 'Unknown'),
            TG_TABLE_NAME,
            NEW.id,
            'Создан',
            NOW()
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (user_id, user_name, object_type, object_id, action, created_at)
        VALUES (
            NEW.user_id, 
            COALESCE(NEW.name, NEW.title, NEW.label, 'Unknown'),
            TG_TABLE_NAME,
            NEW.id,
            'Отредактирован',
            NOW()
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (user_id, user_name, object_type, object_id, action, created_at)
        VALUES (
            OLD.user_id, 
            COALESCE(OLD.name, OLD.title, OLD.label, 'Unknown'),
            TG_TABLE_NAME,
            OLD.id,
            'Удалён',
            NOW()
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Пример создания триггеров для конкретных таблиц (их нужно будет настроить под каждую целевую таблицу)
-- Пример для таблицы sections:
-- CREATE TRIGGER audit_sections_trigger
--     AFTER INSERT OR UPDATE OR DELETE ON sections
--     FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Пример для таблицы banners:
-- CREATE TRIGGER audit_banners_trigger
--     AFTER INSERT OR UPDATE OR DELETE ON banners
--     FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Пример для таблицы products:
-- CREATE TRIGGER audit_products_trigger
--     AFTER INSERT OR UPDATE OR DELETE ON products
--     FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();