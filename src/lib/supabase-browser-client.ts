import { createClient } from '@supabase/supabase-js';

// Конфигурация клиента Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Создаем клиентский экземпляр Supabase
export const createSupabaseBrowserClient = () => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Отсутствуют переменные окружения для Supabase');
  }

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
};