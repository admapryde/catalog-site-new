-- setup-audit-rls.sql
-- Настройка политик безопасности строк для таблицы audit_log

-- Включаем RLS для таблицы аудита
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Удаляем все существующие политики (если есть)
DROP POLICY IF EXISTS "Admin can view audit logs" ON audit_log;
DROP POLICY IF EXISTS "Service role can insert audit logs" ON audit_log;

-- Политика: только администраторы могут читать историю аудита
CREATE POLICY "Admin can view audit logs" ON audit_log
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Политика: сервисная роль может вставлять записи в журнал аудита
CREATE POLICY "Service role can insert audit logs" ON audit_log
FOR INSERT TO service_role
WITH CHECK (true);

-- Политика: аутентифицированные пользователи могут вставлять записи в журнал аудита
-- (только если они вставляют свои собственные действия)
CREATE POLICY "Authenticated users can insert their own audit logs" ON audit_log
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Примечание: Обновление и удаление записей аудита обычно запрещено
-- для обеспечения целостности журнала