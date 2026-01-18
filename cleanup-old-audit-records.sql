-- cleanup-old-audit-records.sql
-- Хранимая процедура для автоматического удаления старых записей аудита

-- Создаем функцию для очистки старых записей аудита
CREATE OR REPLACE FUNCTION cleanup_old_audit_records(retention_days INTEGER DEFAULT 90)
RETURNS TABLE(deleted_count INTEGER) AS $$
DECLARE
    deleted_count_var INTEGER;
    cutoff_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Вычисляем дату, раньше которой удаляем записи
    cutoff_date := NOW() - INTERVAL '1 day' * retention_days;
    
    -- Удаляем записи, старше заданного периода
    DELETE FROM audit_log 
    WHERE created_at < cutoff_date;
    
    -- Возвращаем количество удаленных записей
    GET DIAGNOSTICS deleted_count_var = ROW_COUNT;
    
    RETURN QUERY SELECT deleted_count_var;
END;
$$ LANGUAGE plpgsql;

-- Пример вызова функции для удаления записей старше 90 дней
-- SELECT * FROM cleanup_old_audit_records(90);

-- Создаем задачу для автоматического выполнения очистки (требует расширения pg_cron)
-- SELECT cron.schedule(
--     'cleanup-audit-logs', 
--     '0 2 * * 0',  -- выполняется каждое воскресенье в 2:00 утра
--     $$SELECT * FROM cleanup_old_audit_records(90)$$
-- );