import { NextRequest } from 'next/server';
import { createAPIClient } from '@/lib/supabase-server';

// Тестовый API маршрут для проверки работы типов характеристик
export async function GET(request: NextRequest) {
  try {
    const supabase = await createAPIClient(request);

    // Проверяем наличие таблицы spec_types и её содержимое
    const { data: specTypes, error: specTypesError } = await supabase
      .from('spec_types')
      .select('*');

    if (specTypesError) {
      throw specTypesError;
    }

    // Проверяем наличие столбца spec_type_id в product_specs
    const { data: productSpecs, error: productSpecsError } = await supabase
      .from('product_specs')
      .select('*, spec_type:spec_types(filter_type)')
      .limit(5); // Берем только 5 записей для тестирования

    if (productSpecsError) {
      throw productSpecsError;
    }

    // Проверяем, что типы характеристик корректно связаны
    const specsWithTypes = productSpecs.map(spec => ({
      ...spec,
      spec_type_name: typeof spec.spec_type === 'object' && spec.spec_type !== null 
        ? spec.spec_type.filter_type 
        : spec.spec_type
    }));

    return Response.json({
      success: true,
      specTypesCount: specTypes.length,
      sampleSpecs: specsWithTypes,
      specTypes: specTypes
    });
  } catch (error: any) {
    console.error('Ошибка проверки типов характеристик:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}