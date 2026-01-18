import { createClient } from '@supabase/supabase-js'

// Подключение к Supabase для клиентских компонентов
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)