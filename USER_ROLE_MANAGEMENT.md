# Управление ролями пользователей в Supabase

## Проблема
При создании страниц в админ-панели возникала ошибка:
```
500 "{\"error\":\"new row violates row-level security policy for table \\\"pages\\\"\"}"
```

## Причина
RLS (Row Level Security) политики в Supabase проверяли наличие роли администратора в JWT токене, но использовали неправильный путь для доступа к данным о роли пользователя.

## Решение
Исправлены RLS политики в следующих файлах:
- `create-pages-tables.sql`
- `update-pages-rls-policies.sh`

Теперь политики правильно обращаются к `auth.jwt() -> 'user_metadata' ->> 'role'` вместо `auth.jwt() ->> 'role'`.

## Установка роли администратора

Для того чтобы пользователь мог управлять страницами, ему необходимо назначить роль администратора. Это можно сделать с помощью специального скрипта:

### Установка роли по ID пользователя:
```bash
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key" NEXT_PUBLIC_SUPABASE_URL="your_supabase_url" npm run db:set-user-role -- <user_id> admin
```

### Установка роли по email:
```bash
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key" NEXT_PUBLIC_SUPABASE_URL="your_supabase_url" npm run db:set-user-role-email -- user@example.com admin
```

### Переменные окружения
Для работы скрипта необходимы следующие переменные окружения:
- `NEXT_PUBLIC_SUPABASE_URL` - URL вашего Supabase проекта
- `SUPABASE_SERVICE_ROLE_KEY` - Service Role Key вашего Supabase проекта (можно получить в настройках проекта в Supabase Dashboard)

### Доступные роли:
- `admin` - стандартный администратор
- `super_admin` - супер администратор с расширенными правами
- `user` - обычный пользователь

## Безопасность
Service Role Key предоставляет полный доступ ко всем данным в вашем Supabase проекте, поэтому:
1. Не храните его в коде проекта
2. Используйте его только в защищенных средах (локально или на сервере)
3. Не отправляйте в публичные репозитории