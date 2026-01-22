import { NextRequest } from 'next/server';
import { createAPIClient, supabaseWithRetry } from '@/lib/supabase-server';

// Получение доступных значений характеристик для фильтрации по категории
export async function GET(request: NextRequest) {
  try {
    const supabase = await createAPIClient(request);

    // Извлекаем параметры из URL
    const { searchParams } = new URL(request.url);
    const category_id = searchParams.get('category_id');
    const product_ids = searchParams.get('product_ids'); // Опционально: конкретные ID товаров

    if (!category_id && !product_ids) {
      return Response.json({ error: 'Either category_id or product_ids must be provided' }, { status: 400 });
    }

    // Сначала получаем ID товаров по категории, если она указана
    let productIds: string[] = [];

    if (category_id) {
      const productsResult = await supabaseWithRetry(supabase, (client) =>
        client
          .from('products')
          .select('id')
          .eq('category_id', category_id)
      );

      const { data: productsData, error: productsError } = productsResult as { data: any; error: any };

      if (productsError) {
        throw productsError;
      }

      productIds = productsData?.map((p: any) => p.id) || [];
    }

    // Запрос для получения уникальных комбинаций названий характеристик, их типов и значений
    let specsData: any[] = [];
    let specsError: any = null;

    if (category_id) {
      // Если указана категория, получаем значения только для товаров из этой категории
      const specsResult = await supabaseWithRetry(supabase, (client) =>
        client
          .from('product_specs')
          .select(`
            property_name,
            value,
            spec_type_id
          `)
          .in('product_id', productIds)
      ) as { data: any; error: any };

      specsData = specsResult.data || [];
      specsError = specsResult.error;
    } else if (product_ids) {
      // Если указаны конкретные ID товаров, фильтруем по ним
      const ids = product_ids.split(',').map(id => id.trim());
      const specsResult = await supabaseWithRetry(supabase, (client) =>
        client
          .from('product_specs')
          .select(`
            property_name,
            value,
            spec_type_id
          `)
          .in('product_id', ids)
      ) as { data: any; error: any };

      specsData = specsResult.data || [];
      specsError = specsResult.error;
    } else {
      // Без фильтрации
      const specsResult = await supabaseWithRetry(supabase, (client) =>
        client
          .from('product_specs')
          .select(`
            property_name,
            value,
            spec_type_id
          `)
      ) as { data: any; error: any };

      specsData = specsResult.data || [];
      specsError = specsResult.error;
    }

    if (specsError) {
      throw specsError;
    }

    // Теперь получим информацию о типах характеристик отдельно, чтобы избежать ошибок из-за некорректных внешних ключей
    const specTypeIds = specsData.map(spec => spec.spec_type_id).filter(Boolean);
    let specTypesMap: Record<string, any> = {};

    if (specTypeIds.length > 0) {
      const specTypesResult = await supabaseWithRetry(supabase, (client) =>
        client
          .from('spec_types')
          .select('id, filter_type')
          .in('id', specTypeIds)
      );

      const { data: specTypes, error: specTypesError } = specTypesResult as { data: any; error: any };

      if (specTypesError) {
        console.error('Ошибка получения типов характеристик:', specTypesError);
        // Продолжаем работу, даже если не удалось получить типы
      } else {
        specTypesMap = specTypes.reduce((acc: Record<string, any>, type: any) => {
          acc[type.id] = type;
          return acc;
        }, {});
      }
    }

    // Группируем данные по названию характеристики и типу
    const groupedSpecs: Record<string, { spec_type: string; values: Set<string> }> = {};

    specsData.forEach(spec => {
      // Извлекаем тип из связанной таблицы или используем значение по умолчанию
      let specType = 'SELECT'; // По умолчанию используем SELECT

      if (spec.spec_type_id && specTypesMap[spec.spec_type_id]) {
        specType = specTypesMap[spec.spec_type_id].filter_type;
      }

      if (!groupedSpecs[spec.property_name]) {
        groupedSpecs[spec.property_name] = {
          spec_type: specType,
          values: new Set<string>()
        };
      }
      groupedSpecs[spec.property_name].values.add(spec.value);
    });

    // Преобразуем в нужный формат
    const specFilters = Object.entries(groupedSpecs).map(([property_name, data]) => ({
      property_name,
      spec_type: data.spec_type,
      available_values: Array.from(data.values).sort()
    }));

    return Response.json(specFilters);
  } catch (error: any) {
    console.error('Ошибка получения значений характеристик для фильтрации:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}