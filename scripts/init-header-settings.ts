import { createClient } from '@supabase/supabase-js';

async function initializeHeaderSettings() {
  // Используем переменные окружения
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Необходимо указать NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY в переменных окружения');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  });

  // Проверяем, существуют ли уже настройки
  const { data: existingSettings } = await supabase
    .from('site_settings')
    .select('setting_key')
    .in('setting_key', ['header_title', 'nav_home', 'nav_catalog', 'nav_about', 'nav_contacts']);

  const existingKeys = existingSettings?.map(setting => setting.setting_key) || [];
  const settingsToInsert = [];

  if (!existingKeys.includes('header_title')) {
    settingsToInsert.push({
      setting_key: 'header_title',
      setting_value: 'Каталог'
    });
  }

  if (!existingKeys.includes('nav_home')) {
    settingsToInsert.push({
      setting_key: 'nav_home',
      setting_value: 'Главная'
    });
  }

  if (!existingKeys.includes('nav_catalog')) {
    settingsToInsert.push({
      setting_key: 'nav_catalog',
      setting_value: 'Каталог'
    });
  }

  if (!existingKeys.includes('nav_about')) {
    settingsToInsert.push({
      setting_key: 'nav_about',
      setting_value: 'О нас'
    });
  }

  if (!existingKeys.includes('nav_contacts')) {
    settingsToInsert.push({
      setting_key: 'nav_contacts',
      setting_value: 'Контакты'
    });
  }

  if (settingsToInsert.length > 0) {
    const { error } = await supabase
      .from('site_settings')
      .insert(settingsToInsert);

    if (error) {
      console.error('Ошибка при добавлении начальных настроек шапки:', error);
    } else {
      console.log('Начальные настройки шапки успешно добавлены:', settingsToInsert);
    }
  } else {
    console.log('Настройки шапки уже существуют в базе данных');
  }
}

// Выполняем инициализацию
initializeHeaderSettings().catch(console.error);