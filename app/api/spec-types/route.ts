import { NextRequest } from 'next/server';
import { createAPIClient } from '@/lib/supabase-server';

// Получение всех типов характеристик
export async function GET(request: NextRequest) {
  try {
    const supabase = await createAPIClient(request);

    // Извлекаем параметры из URL
    const { searchParams } = new URL(request.url);
    const category_id = searchParams.get('category_id');
    const search = searchParams.get('search');

    let query = supabase
      .from('spec_types')
      .select(`
        *,
        category:categories(name)
      `)
      .order('name', { ascending: true });

    if (category_id) {
      query = query.eq('category_id', category_id).or(`category_id.is.null`);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Преобразуем данные, чтобы включить название категории
    const transformedData = data.map(item => ({
      ...item,
      category_name: item.category?.name || 'Общие'
    }));

    return Response.json(transformedData);
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