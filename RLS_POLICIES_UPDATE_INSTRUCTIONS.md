# Инструкция по обновлению RLS политик в Supabase

## Проблема
В проекте возникли ошибки, связанные с RLS (Row Level Security) политиками в Supabase. Основная проблема заключается в использовании небезопасных ссылок на `user_metadata` в RLS политиках, что приводит к ошибкам типа:
- `permission denied for table users`
- `new row violates row-level security policy for table "pages"`

## Причина
Использование выражений вроде `auth.jwt() -> 'user_metadata' ->> 'role'` в RLS политиках является небезопасным, поскольку `user_metadata` может быть изменен конечными пользователями. Supabase линтер безопасности выявил эти уязвимости.

## Решение
Все RLS политики были обновлены для использования безопасной проверки через прямой запрос к таблице `auth.users`:

### До (небезопасно):
```sql
auth.jwt() -> 'user_metadata' ->> 'role' IN ('admin', 'super_admin')
```

### После (безопасно):
```sql
EXISTS (
  SELECT 1 FROM auth.users
  WHERE id = auth.uid()
  AND (
    auth.users.raw_user_meta_data->>'role' = 'admin'
    OR auth.users.raw_user_meta_data->>'role' = 'super_admin'
  )
)
OR (
  auth.jwt() ->> 'role' = 'service_role'
)
```

## Файлы, содержащие обновленные политики

1. `reset-and-apply-rls-policies.sql` - файл, который удаляет все существующие политики и создает заново с безопасными конфигурациями
2. `reset-and-apply-rls-policies.sh` - скрипт для применения политик

## Как применить изменения

### Вариант 1: Применить обновленные политики (рекомендуется)
```bash
chmod +x reset-and-apply-rls-policies.sh
./reset-and-apply-rls-policies.sh
```

### Вариант 2: Применить только политики для страниц
```bash
chmod +x update-pages-rls-policies.sh
./update-pages-rls-policies.sh
```

### Вариант 3: Применить вручную через SQL редактор Supabase
1. Откройте SQL редактор в Supabase Dashboard
2. Скопируйте и выполните содержимое файла `reset-and-apply-rls-policies.sql`

## Важные замечания

1. Убедитесь, что у ваших администраторов в Supabase правильно установлены роли в `user_metadata`
2. Роли могут быть `admin` или `super_admin`
3. Service role может обходить RLS политики для административных операций
4. После применения политик проверьте работу админ-панели

## Проверка правильности установки ролей администратора

Чтобы установить роль администратора пользователю, выполните в SQL редакторе:

```sql
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'
WHERE email = 'your-admin-email@example.com';
```

Или через Supabase Dashboard:
1. Перейдите в Authentication > Users
2. Найдите нужного пользователя
3. Нажмите "Edit"
4. В поле "User metadata" добавьте: `{"role": "admin"}`

## Проверка результатов

После применения политик:
1. Проверьте, что админ-панель работает корректно
2. Убедитесь, что обычные пользователи не имеют доступа к административным функциям
3. Проверьте, что публичные данные (категории, продукты и т.д.) остаются доступными для неавторизованных пользователей