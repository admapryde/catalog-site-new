import { createClient } from '@/lib/supabase-server';

// Типы для блоков главной страницы
interface HomepageBlock {
  id: string;
  type: string;
  position: number;
  settings: Record<string, any>; // JSON-объект с настройками
  visible: boolean;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Тип для структуры главной страницы (только блоки)
interface HomepageStructure {
  blocks: HomepageBlock[];
}

/**
 * Получает структуру главной страницы (только блоки) на сервере
 */
export async function getHomepageStructureServer(): Promise<HomepageStructure> {
  const supabase = await createClient();

  try {
    // Получаем все активные и видимые блоки для главной страницы
    const { data: blocks, error: blocksError } = await supabase
      .from('homepage_blocks')
      .select('*')
      .eq('enabled', true)
      .eq('visible', true)
      .order('position', { ascending: true });

    if (blocksError) {
      console.error('Ошибка получения блоков главной страницы:', blocksError.message || blocksError);
      throw blocksError;
    }

    // Формируем структуру главной страницы (только блоки)
    const homepageStructure: HomepageStructure = {
      blocks: blocks || []
    };

    console.log('Структура главной страницы успешно получена на сервере');
    return homepageStructure;
  } catch (error: any) {
    console.error('Ошибка получения структуры главной страницы на сервере:', error);
    // Возвращаем пустую структуру в случае ошибки
    const defaultStructure: HomepageStructure = {
      blocks: []
    };

    return defaultStructure;
  }
}