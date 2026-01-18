-- setup-cron-extension.sql
-- Настройка расширения pg_cron для автоматического выполнения задач

-- Устанавливаем расширение pg_cron (требуется однократно)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Создаем задачу для автоматического выполнения очистки старых записей аудита
SELECT cron.schedule(
    'cleanup-old-audit-records-weekly', 
    '0 2 * * 0',  -- выполняется каждое воскресенье в 2:00 утра
    $$SELECT * FROM cleanup_old_audit_records(90)$$
);

-- Пример другой задачи - ежедневная очистка записей старше 30 дней
-- SELECT cron.schedule(
--     'cleanup-old-audit-records-daily', 
--     '0 1 * * *',  -- выполняется каждый день в 1:00 утра
--     $$SELECT * FROM cleanup_old_audit_records(30)$$
-- );

-- Просмотр активных задач
-- SELECT * FROM cron.job;

-- Для отмены задачи используйте:
-- SELECT cron.unschedule('cleanup-old-audit-records-weekly');