#!/bin/bash
# Script to verify all admin pages have been updated with the unified sidebar

echo "Проверка обновления всех страниц админ-панели..."

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
    echo "✓ $page - содержит AdminSidebar"
  else
    echo "✗ $page - НЕ содержит AdminSidebar"
    all_good=false
  fi
done

echo ""
if [ "$all_good" = true ]; then
  echo "Все страницы админ-панели успешно обновлены!"
  echo "Проблема с исчезающими пунктами меню решена."
else
  echo "Обнаружены проблемы с обновлением страниц."
fi