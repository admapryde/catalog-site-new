// Скрипт для проверки данных о баннерах
const { createClient } = require('@supabase/supabase-js');

// Получаем переменные окружения
require('dotenv').config({ path: '.env.local' });

async function checkBannerData() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('Не найдены переменные окружения для Supabase. Проверьте файл .env.local');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  console.log('Получаем данные о группах баннеров...');
  
  const { data: groups, error: groupsError } = await supabase
    .from('banner_groups')
    .select(`
      *,
      banners(*)
    `)
    .order('position', { ascending: true })
    .order('sort_order', { foreignTable: 'banners', ascending: true });

  if (groupsError) {
    console.error('Ошибка получения групп баннеров:', groupsError);
    return;
  }

  console.log(`Найдено ${groups.length} групп(ы) баннеров:`);
  groups.forEach((group, index) => {
    console.log(`\nГруппа ${index + 1}:`);
    console.log(`  ID: ${group.id}`);
    console.log(`  Название: ${group.title}`);
    console.log(`  Позиция: ${group.position}`);
    console.log(`  Количество баннеров: ${group.banners.length}`);
    
    group.banners.forEach((banner, bannerIndex) => {
      console.log(`    Баннер ${bannerIndex + 1}:`);
      console.log(`      ID: ${banner.id}`);
      console.log(`      Изображение: ${banner.image_url}`);
      console.log(`      Ссылка: ${banner.link_url}`);
      console.log(`      Порядок: ${banner.sort_order}`);
    });
  });
}

checkBannerData().catch(console.error);