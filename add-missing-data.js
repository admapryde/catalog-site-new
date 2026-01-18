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

async function main() {
  if (!isPlaceholderUrl && !isPlaceholderKey) {
    // Подключаемся к Supabase
    const { createClient } = await import('@supabase/supabase-js');

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    try {
      // Добавим баннер в существующую группу
      console.log('\nДобавляем баннер в группу...');

      // Сначала получим существующие группы баннеров
      const { data: bannerGroups, error: groupsError } = await supabase
        .from('banner_groups')
        .select('*');

      if (groupsError) {
        console.error('Ошибка получения групп баннеров:', groupsError);
        return;
      }

      if (bannerGroups && bannerGroups.length > 0) {
        const groupId = bannerGroups[0].id;
        console.log(`Найдена группа баннеров с ID: ${groupId}`);

        // Добавим баннер в эту группу
        const { data: newBanner, error: bannerError } = await supabase
          .from('banners')
          .insert([{
            group_id: groupId,
            image_url: 'https://placehold.co/800x400?text=Test+Banner',
            link_url: '/products',
            sort_order: 0
          }])
          .select()
          .single();

        if (bannerError) {
          console.error('Ошибка добавления баннера:', bannerError);
        } else {
          console.log('Баннер успешно добавлен:', newBanner);
        }
      } else {
        console.log('Не найдено групп баннеров для добавления баннера');
      }

      // Также добавим изображение к существующему продукту
      console.log('\nДобавляем изображение к продукту...');

      // Получим существующие продукты
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*');

      if (productsError) {
        console.error('Ошибка получения продуктов:', productsError);
        return;
      }

      if (products && products.length > 0) {
        const productId = products[0].id;
        console.log(`Найден продукт с ID: ${productId}`);

        // Добавим изображение к этому продукту
        const { data: newImage, error: imageError } = await supabase
          .from('product_images')
          .insert([{
            product_id: productId,
            image_url: 'https://placehold.co/400x400?text=Product+Image',
            is_main: true
          }])
          .select()
          .single();

        if (imageError) {
          console.error('Ошибка добавления изображения к продукту:', imageError);
        } else {
          console.log('Изображение успешно добавлено к продукту:', newImage);
        }
      } else {
        console.log('Не найдено продуктов для добавления изображения');
      }

    } catch (error) {
      console.error('❌ Ошибка при работе с Supabase:', error);
    }
  } else {
    console.log('\n⚠️  Необходимо обновить учетные данные Supabase в файле .env.local');
    console.log('👉 См. инструкции в файле SUPABASE_SETUP_INSTRUCTIONS.md');
  }
}

main();