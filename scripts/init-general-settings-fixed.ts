import { createClient } from '@supabase/supabase-js';

async function initializeGeneralSettings() {
  // Use service role key to bypass RLS for initialization
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    console.error('NEXT_PUBLIC_SUPABASE_URL is not set');
    return;
  }

  if (!supabaseServiceRoleKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is not set');
    console.log('Attempting to initialize with anon key (may fail due to RLS)...');
    
    // Fallback to the original client if service role key is not available
    const { createClient: createAnonClient } = await import('@/lib/supabase-server');
    const supabase = await createAnonClient();
    
    try {
      // Check if a record already exists
      const { data: existingRecord, error: selectError } = await supabase
        .from('general_settings')
        .select('id')
        .limit(1);

      if (selectError && selectError.code !== '42P01') {
        console.error('Error checking for existing settings:', selectError.message || selectError);
        throw selectError;
      }

      // If table exists and no records exist, add initial record
      if (existingRecord && existingRecord.length === 0) {
        const { error: insertError } = await supabase
          .from('general_settings')
          .insert([{
            site_title: 'Каталог',
            site_icon: '/favicon.png',
            site_footer_info: '© 2026 Каталог. Все права защищены.'
          }]);

        if (insertError) {
          console.error('Error inserting initial settings:', insertError.message || insertError);
          throw insertError;
        }

        console.log('Initial general settings successfully added using anon key');
      } else {
        console.log('General settings already exist in database');
      }
    } catch (error) {
      console.error('Error initializing general settings with anon key:', error);
      throw error;
    }
    
    return;
  }

  // Use service role key for initialization
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    // Check if a record already exists
    const { data: existingRecord, error: selectError } = await supabase
      .from('general_settings')
      .select('id')
      .limit(1);

    if (selectError && selectError.code !== '42P01') {
      console.error('Error checking for existing settings:', selectError.message || selectError);
      throw selectError;
    }

    // If table exists and no records exist, add initial record
    if (existingRecord && existingRecord.length === 0) {
      const { error: insertError } = await supabase
        .from('general_settings')
        .insert([{
          site_title: 'Каталог',
          site_icon: '/favicon.png',
          site_footer_info: '© 2026 Каталог. Все права защищены.'
        }]);

      if (insertError) {
        console.error('Error inserting initial settings:', insertError.message || insertError);
        throw insertError;
      }

      console.log('Initial general settings successfully added using service role key');
    } else {
      console.log('General settings already exist in database');
    }
  } catch (error) {
    if ((error as any).code === '42P01') {
      console.log('Table general_settings does not exist, migration may not have run yet');
    } else {
      console.error('Error initializing general settings:', error);
      throw error;
    }
  }
}

// Run initialization
initializeGeneralSettings().catch(console.error);