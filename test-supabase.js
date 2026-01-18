// Читаем .env файл вручную
import * as fs from 'fs';
import dotenv from 'dotenv';

// Загружаем переменные окружения из .env.local
if (fs.existsSync('./.env.local')) {
  dotenv.config({ path: './.env.local' });
}

// Получаем переменные из окружения
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

// Проверяем, являются ли значения заглушками
const isPlaceholderUrl = !supabaseUrl || supabaseUrl === '' || supabaseUrl.includes('your_supabase_url_here') || supabaseUrl.includes('supabase_url_here');
const isPlaceholderKey = !supabaseAnonKey || supabaseAnonKey === '' || supabaseAnonKey.includes('your_supabase_anon_key_here') || supabaseAnonKey.includes('supabase_anon_key_here');

console.log('Supabase URL:', supabaseUrl ? (isPlaceholderUrl ? '[ЗАГЛУШКА - ТРЕБУЕТСЯ ОБНОВЛЕНИЕ]' : supabaseUrl) : 'НЕ НАЙДЕНО');
console.log('Supabase Anon Key:', supabaseAnonKey ? (isPlaceholderKey ? '[ЗАГЛУШКА - ТРЕБУЕТСЯ ОБНОВЛЕНИЕ]' : `[НАЙДЕН - ${supabaseAnonKey.substring(0, 10)}...]`) : 'НЕ НАЙДЕН');
console.log('Конфигурация действительна:', !isPlaceholderUrl && !isPlaceholderKey);

if (!isPlaceholderUrl && !isPlaceholderKey) {
  // Проверим подключение к Supabase
  const { createClient } = await import('@supabase/supabase-js');

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Попробуем получить категории
    console.log('\nПопытка получить категории...');
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .limit(16);

    if (categoriesError) {
      console.error('Ошибка получения категорий:', categoriesError);
    } else {
      console.log('Количество категорий:', categories?.length || 0);
      console.log('Категории успешно получены');
    }

    // Попробуем получить группы баннеров
    console.log('\nПопытка получить группы баннеров...');
    const { data: bannerGroups, error: bannerGroupsError } = await supabase
      .from('banner_groups')
      .select(`
        *,
        banners(*)
      `)
      .order('position', { ascending: true });

    if (bannerGroupsError) {
      console.error('Ошибка получения групп баннеров:', bannerGroupsError);
    } else {
      console.log('Количество групп баннеров:', bannerGroups?.length || 0);
      console.log('Группы баннеров успешно получены');
    }

    // Попробуем получить продукты
    console.log('\nПопытка получить продукты...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        *,
        product_images(*)
      `)
      .order('created_at', { ascending: false })
      .limit(8);

    if (productsError) {
      console.error('Ошибка получения продуктов:', productsError);
    } else {
      console.log('Количество продуктов:', products?.length || 0);
      console.log('Продукты успешно получены');
    }

    console.log('\n✅ Подключение к Supabase успешно установлено!');
  } catch (error) {
    console.error('❌ Ошибка при работе с Supabase:', error);
  }
} else {
  console.log('\n⚠️  Необходимо обновить учетные данные Supabase в файле .env.local');
  console.log('👉 См. инструкции в файле SUPABASE_SETUP_INSTRUCTIONS.md');
}