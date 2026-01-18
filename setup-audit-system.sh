#!/bin/bash
# setup-audit-system.sh - Скрипт для настройки системы аудита в Supabase

set -e  # Прекращаем выполнение при ошибке

echo "Настройка системы аудита в Supabase..."

# Проверяем, установлен ли supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "Ошибка: Supabase CLI не установлен. Установите его с помощью:"
    echo "  npm install -g supabase"
    exit 1
fi

# Проверяем, авторизован ли пользователь
if ! supabase auth status &> /dev/null; then
    echo "Авторизация в Supabase..."
    supabase login
fi

PROJECT_ID=${SUPABASE_PROJECT_ID:-""}
if [ -z "$PROJECT_ID" ]; then
    echo "Введите ID вашего проекта Supabase:"
    read PROJECT_ID
fi

echo "Выбранный проект: $PROJECT_ID"

# Создаем таблицу аудита
echo "Создание таблицы audit_log..."
supabase db remote exec < create-audit-log-table.sql

if [ $? -eq 0 ]; then
    echo "✓ Таблица audit_log успешно создана"
else
    echo "✗ Ошибка при создании таблицы audit_log"
    exit 1
fi

# Применяем миграции, если таблица уже существовала
echo "Применение миграций (если необходимо)..."
supabase db remote exec < migrate-audit-log-table.sql

if [ $? -eq 0 ]; then
    echo "✓ Миграции успешно применены"
else
    echo "ℹ Миграции не требуются или произошла ошибка (это нормально)"
fi

# Добавляем RLS политики (необязательно)
echo "Настройка политик безопасности строк (RLS)..."
supabase db remote exec << EOF
-- Включаем RLS для таблицы аудита
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Создаем политику: только администраторы могут читать историю аудита
CREATE POLICY "Admin can view audit logs" ON audit_log
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
EOF

if [ $? -eq 0 ]; then
    echo "✓ Политики безопасности успешно настроены"
else
    echo "⚠ Ошибка при настройке политик безопасности (продолжаем выполнение)"
fi

echo ""
echo "✓ Система аудита успешно настроена!"
echo ""
echo "Следующие шаги:"
echo "1. Убедитесь, что в вашем приложении настроены права доступа к таблице audit_log"
echo "2. Интегрируйте auditService в ваши API-эндпоинты для записи событий"
echo "3. Добавьте компонент AuditHistoryDashboard на страницу админ-панели"
echo ""
echo "Для тестирования системы аудита выполните:"
echo "  - Вызовите любое действие администратора"
echo "  - Проверьте содержимое таблицы audit_log"
echo "  - Убедитесь, что данные корректно отображаются в админ-панели"