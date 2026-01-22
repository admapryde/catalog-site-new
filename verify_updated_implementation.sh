#!/bin/bash

echo "Проверка реализации изменений для решения проблем с админ-панелью..."

echo "1. Проверка наличия обновленных файлов:"
echo "   - /var/home/evgen/pepperCat/vcDeploy/src/lib/supabase-server.ts: $(if [ -f /var/home/evgen/pepperCat/vcDeploy/src/lib/supabase-server.ts ]; then echo "OK"; else echo "НЕТ"; fi)"
echo "   - /var/home/evgen/pepperCat/vcDeploy/app/api/admin/products/route.ts: $(if [ -f /var/home/evgen/pepperCat/vcDeploy/app/api/admin/products/route.ts ]; then echo "OK"; else echo "НЕТ"; fi)"
echo "   - /var/home/evgen/pepperCat/vcDeploy/app/api/admin/categories/route.ts: $(if [ -f /var/home/evgen/pepperCat/vcDeploy/app/api/admin/categories/route.ts ]; then echo "OK"; else echo "НЕТ"; fi)"
echo "   - /var/home/evgen/pepperCat/vcDeploy/app/api/admin/templates/route.ts: $(if [ -f /var/home/evgen/pepperCat/vcDeploy/app/api/admin/templates/route.ts ]; then echo "OK"; else echo "НЕТ"; fi)"
echo "   - /var/home/evgen/pepperCat/vcDeploy/app/api/spec-types/route.ts: $(if [ -f /var/home/evgen/pepperCat/vcDeploy/app/api/spec-types/route.ts ]; then echo "OK"; else echo "НЕТ"; fi)"
echo "   - /var/home/evgen/pepperCat/vcDeploy/src/utils/cache-manager.ts: $(if [ -f /var/home/evgen/pepperCat/vcDeploy/src/utils/cache-manager.ts ]; then echo "OK"; else echo "НЕТ"; fi)"

echo ""
echo "2. Проверка обновленных компонентов:"
echo "   - /var/home/evgen/pepperCat/vcDeploy/src/components/admin/ProductsManager.tsx: $(if [ -f /var/home/evgen/pepperCat/vcDeploy/src/components/admin/ProductsManager.tsx ]; then echo "OK"; else echo "НЕТ"; fi)"
echo "   - /var/home/evgen/pepperCat/vcDeploy/src/components/admin/TemplatesManager.tsx: $(if [ -f /var/home/evgen/pepperCat/vcDeploy/src/components/admin/TemplatesManager.tsx ]; then echo "OK"; else echo "НЕТ"; fi)"
echo "   - /var/home/evgen/pepperCat/vcDeploy/src/components/admin/SpecTypesManager.tsx: $(if [ -f /var/home/evgen/pepperCat/vcDeploy/src/components/admin/SpecTypesManager.tsx ]; then echo "OK"; else echo "НЕТ"; fi)"
echo "   - /var/home/evgen/pepperCat/vcDeploy/src/components/admin/CategoriesManager.tsx: $(if [ -f /var/home/evgen/pepperCat/vcDeploy/src/components/admin/CategoriesManager.tsx ]; then echo "OK"; else echo "НЕТ"; fi)"

echo ""
echo "3. Проверка ключевых изменений в файлах:"

# Проверяем наличие кэширования в API маршрутах
echo "   - Наличие кэширования в /api/admin/products/route.ts:"
if grep -q "cacheManager" /var/home/evgen/pepperCat/vcDeploy/app/api/admin/products/route.ts; then
  echo "     ✅ Найдено использование cacheManager"
else
  echo "     ❌ Не найдено использование cacheManager"
fi

# Проверяем наличие проверки аутентификации
echo "   - Наличие проверки аутентификации в /api/admin/products/route.ts:"
if grep -q "getAdminSession" /var/home/evgen/pepperCat/vcDeploy/app/api/admin/products/route.ts; then
  echo "     ✅ Найдена проверка аутентификации"
else
  echo "     ❌ Не найдена проверка аутентификации"
fi

# Проверяем наличие повторных попыток в supabase-server.ts
echo "   - Наличие повторных попыток в supabase-server.ts:"
if grep -q "retryOnRateLimit" /var/home/evgen/pepperCat/vcDeploy/src/lib/supabase-server.ts; then
  echo "     ✅ Найдена обработка ограничения частоты запросов"
else
  echo "     ❌ Не найдена обработка ограничения частоты запросов"
fi

# Проверяем обновления в компонентах
echo "   - Наличие улучшенной обработки ошибок в ProductsManager.tsx:"
if grep -q "showNotification(error.message" /var/home/evgen/pepperCat/vcDeploy/src/components/admin/ProductsManager.tsx; then
  echo "     ✅ Найдена улучшенная обработка ошибок"
else
  echo "     ❌ Не найдена улучшенная обработка ошибок"
fi

echo ""
echo "4. Проверка зависимостей:"
echo "   - next: $(npm list next | head -1)"
echo "   - @supabase/ssr: $(npm list @supabase/ssr | head -1)"
echo "   - @supabase/supabase-js: $(npm list @supabase/supabase-js | head -1)"

echo ""
echo "5. Проверка тестового скрипта:"
if [ -f /var/home/evgen/pepperCat/vcDeploy/test-api-functionality.ts ]; then
  echo "   ✅ Тестовый скрипт создан: test-api-functionality.ts"
else
  echo "   ❌ Тестовый скрипт не найден"
fi

echo ""
echo "Проверка завершена!"