-- Создание таблицы для хранения истории действий пользователей
CREATE TABLE audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_name TEXT NOT NULL,
    object_type VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('Создан', 'Отредактирован', 'Удалён')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индекс для ускорения выборки по дате и времени
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);

-- Индекс для ускорения выборки по типу объекта
CREATE INDEX idx_audit_log_object_type ON audit_log(object_type);

-- Индекс для ускорения выборки по действию
CREATE INDEX idx_audit_log_action ON audit_log(action);