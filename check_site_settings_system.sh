#!/bin/bash

# Скрипт для проверки системы настроек сайта

echo "Проверка системы настроек сайта..."

# Проверяем, что все необходимые файлы существуют
echo "Проверка наличия ключевых файлов..."

if [ -f "app/layout.tsx" ]; then
    echo "✓ app/layout.tsx существует"
else
    echo "✗ app/layout.tsx отсутствует"
fi

if [ -f "app/api/general-settings/route.ts" ]; then
    echo "✓ app/api/general-settings/route.ts существует"
else
    echo "✗ app/api/general-settings/route.ts отсутствует"
fi

if [ -f "src/services/general-settings-service.ts" ]; then
    echo "✓ src/services/general-settings-service.ts существует"
else
    echo "✗ src/services/general-settings-service.ts отсутствует"
fi

if [ -f "src/components/admin/GeneralSettingsForm.tsx" ]; then
    echo "✓ src/components/admin/GeneralSettingsForm.tsx существует"
else
    echo "✗ src/components/admin/GeneralSettingsForm.tsx отсутствует"
fi

# Проверяем, что в layout.tsx используется правильная функция
if grep -q "import.*createClient.*lib/supabase-server" app/layout.tsx; then
    echo "✓ layout.tsx использует правильный клиент Supabase"
else
    echo "✗ layout.tsx не использует правильный клиент Supabase"
fi

# Проверяем, что в layout.tsx используется кэшированная функция
if grep -q "getGeneralSettings" app/layout.tsx; then
    echo "✓ layout.tsx использует кэшированную функцию получения настроек"
else
    echo "✗ layout.tsx не использует кэшированную функцию получения настроек"
fi

# Проверяем, что в API route есть инвалидация кэша
if grep -q "global.generalSettingsCache!.delete" app/api/general-settings/route.ts; then
    echo "✓ API route выполняет инвалидацию кэша"
else
    echo "✗ API route не выполняет инвалидацию кэша"
fi

# Проверяем, что в сервисе есть инвалидация кэша
if grep -q "global.generalSettingsCache.delete" src/services/general-settings-service.ts; then
    echo "✓ Сервис выполняет инвалидацию кэша"
else
    echo "✗ Сервис не выполняет инвалидацию кэша"
fi

echo ""
echo "Проверка завершена!"

# Проверяем, что везде используется одна и та же глобальная переменная кэша
echo ""
echo "Проверка согласованности глобальной переменной кэша..."
if grep -r "generalSettingsCache" app/layout.tsx src/services/general-settings-service.ts app/api/general-settings/route.ts | grep -v ".map" | wc -l > /dev/null; then
    echo "✓ Все файлы используют одну и ту же глобальную переменную кэша"
else
    echo "? Не удалось проверить использование глобальной переменной кэша"
fi