import { NextRequest } from 'next/server';
import { createAPIClient, supabaseWithRetry } from '@/lib/supabase-server';
import { getAdminSession } from '@/services/admin-auth-service';
import { cacheManager } from '@/utils/cache-manager';

// Кэшируем результаты запросов на 5 минут
const CACHE_DURATION = 5 * 60 * 1000; // 5 минут в миллисекундах

// Получение всех типов характеристик
export async function GET(request: NextRequest) {
  // Проверяем, что пользователь аутентифицирован как администратор
  const adminUser = await getAdminSession();
  if (!adminUser) {
    return Response.json({ error: 'Требуется аутентификация администратора' }, { status: 401 });
  }

  try {
    // Извлекаем параметры из URL
    const { searchParams } = new URL(request.url);
    const category_id = searchParams.get('category_id');
    const search = searchParams.get('search');

    // Формируем ключ кэша на основе параметров запроса
    const cacheKey = `spec_types_${category_id || 'all'}_${search || 'none'}`;
    const cached = cacheManager.get<any[]>(cacheKey, CACHE_DURATION);

    // Проверяем, есть ли свежие данные в кэше
    if (cached) {
      const response = Response.json(cached);
      response.headers.set('Cache-Control', 'public, max-age=300'); // 5 минут кэширования
      return response;
    }

    const supabase = await createAPIClient(request);

    const result = await supabaseWithRetry(supabase, (client) =>
      client
        .from('spec_types')
        .select(`
          *,
          category:categories(name)
        `)
        .order('name', { ascending: true })
    ) as { data: any; error: any };

    let { data, error } = result;

    if (category_id) {
      const categoryResult = await supabaseWithRetry(supabase, (client) =>
        client
          .from('spec_types')
          .select(`
            *,
            category:categories(name)
          `)
          .eq('category_id', category_id).or(`category_id.is.null`)
          .order('name', { ascending: true })
      ) as { data: any; error: any };

      data = categoryResult.data;
      error = categoryResult.error;
    }

    if (search) {
      const searchResult = await supabaseWithRetry(supabase, (client) =>
        client
          .from('spec_types')
          .select(`
            *,
            category:categories(name)
          `)
          .ilike('name', `%${search}%`)
          .order('name', { ascending: true })
      ) as { data: any; error: any };

      data = searchResult.data;
      error = searchResult.error;
    }

    if (error) {
      throw error;
    }

    // Преобразуем данные, чтобы включить название категории
    const transformedData = data.map((item: any) => ({
      ...item,
      category_name: item.category?.name || 'Общие'
    }));

    // Сохраняем результат в кэш
    cacheManager.set(cacheKey, transformedData);

    const response = Response.json(transformedData);
    response.headers.set('Cache-Control', 'public, max-age=300'); // 5 минут кэширования
    return response;
  } catch (error: any) {
    console.error('Ошибка получения типов характеристик:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// Создание нового типа характеристики
export async function POST(request: NextRequest) {
  try {
    const supabase = await createAPIClient(request);
    const body = await request.json();
    const { name, filter_type, data_type, category_id } = body;

    const { data, error } = await supabase
      .from('spec_types')
      .insert([{ name, filter_type, data_type, category_id }])
      .select(`
        *,
        category:categories(name)
      `)
      .single();

    if (error) {
      throw error;
    }

    // Преобразуем данные, чтобы включить название категории
    const transformedData = {
      ...data,
      category_name: data.category?.name || 'Общие'
    };

    return Response.json(transformedData);
  } catch (error: any) {
    console.error('Ошибка создания типа характеристики:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// Обновление типа характеристики
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createAPIClient(request);
    const body = await request.json();
    const { id, name, filter_type, data_type, category_id } = body;

    // Проверяем, что id является валидным UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return Response.json({ error: `Invalid spec type ID format: ${id}` }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('spec_types')
      .update({ name, filter_type, data_type, category_id, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        category:categories(name)
      `)
      .single();

    if (error) {
      throw error;
    }

    // Преобразуем данные, чтобы включить название категории
    const transformedData = {
      ...data,
      category_name: data.category?.name || 'Общие'
    };

    return Response.json(transformedData);
  } catch (error: any) {
    console.error('Ошибка обновления типа характеристики:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// Удаление типа характеристики
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({ error: 'ID типа характеристики не указан' }, { status: 400 });
    }

    // Проверяем, что id является валидным UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return Response.json({ error: `Invalid spec type ID format: ${id}` }, { status: 400 });
    }

    const supabase = await createAPIClient(request);

    // Удаляем тип характеристики
    const { error } = await supabase
      .from('spec_types')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return Response.json({ success: true });
  } catch (error: any) {
    console.error('Ошибка удаления типа характеристики:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}