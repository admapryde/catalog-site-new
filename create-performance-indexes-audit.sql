-- create-performance-indexes-audit.sql
-- Дополнительные индексы для оптимизации производительности таблицы аудита

-- Композитный индекс для частых комбинаций фильтров
CREATE INDEX CONCURRENTLY idx_audit_log_type_action_date ON audit_log (object_type, action, created_at DESC);

-- Композитный индекс для фильтрации по пользователю и дате
CREATE INDEX CONCURRENTLY idx_audit_log_user_date ON audit_log (user_id, created_at DESC);

-- Индекс для поиска по IP-адресу (может быть полезен для анализа безопасности)
CREATE INDEX CONCURRENTLY idx_audit_log_ip_address ON audit_log (ip_address, created_at DESC);

-- Индекс для поиска по object_id и object_type (для отслеживания изменений конкретных объектов)
CREATE INDEX CONCURRENTLY idx_audit_log_object_ref ON audit_log (object_type, object_id, created_at DESC);

-- Индекс для поиска по дате с фильтром по действию (для отчетов)
CREATE INDEX CONCURRENTLY idx_audit_log_date_action ON audit_log (created_at DESC, action);

-- Примечание: Используем CONCURRENTLY для создания индексов без блокировки таблицы
-- Это особенно важно для больших таблиц в продакшене