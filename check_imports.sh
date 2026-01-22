#!/bin/bash
# Script to verify all admin pages have the AdminSidebar import

echo "Проверка импортов AdminSidebar во всех страницах админ-панели..."

pages=(
  "app/admin/page.tsx"
  "app/admin/templates/page.tsx"
  "app/admin/banner-groups/page.tsx"
  "app/admin/categories/page.tsx"
  "app/admin/footer-settings/page.tsx"
  "app/admin/header-settings/page.tsx"
  "app/admin/homepage-sections/page.tsx"
  "app/admin/products/page.tsx"
  "app/admin/settings/page.tsx"
)

all_good=true

for page in "${pages[@]}"; do
  if grep -q "AdminSidebar" "$page"; then
    echo "✓ $page - содержит импорт AdminSidebar"
  else
    echo "✗ $page - НЕ содержит импорт AdminSidebar"
    all_good=false
  fi
done

echo ""
if [ "$all_good" = true ]; then
  echo "Все страницы админ-панели имеют правильные импорты!"
  echo "Ошибка 'AdminSidebar is not defined' должна быть исправлена."
else
  echo "Обнаружены проблемы с импортами."
fi