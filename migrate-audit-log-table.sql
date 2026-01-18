-- Миграция для добавления новых полей в таблицу audit_log
-- Выполнить, если таблица была создана до добавления новых полей

-- Добавляем новые столбцы
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS ip_address INET;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Создаем индексы, если они еще не существуют
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_object_id ON audit_log(object_id);