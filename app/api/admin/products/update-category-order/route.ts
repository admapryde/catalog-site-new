import { NextRequest } from 'next/server';
import { createAPIClient, supabaseWithRetry } from '@/lib/supabase-server';
import { auditService } from '@/utils/audit-service';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { categoryId, products } = body;

    if (!categoryId) {
      return Response.json({ error: 'ID категории не предоставлен' }, { status: 400 });
    }

    if (!Array.isArray(products)) {
      return Response.json({ error: 'Массив товаров не предоставлен' }, { status: 400 });
    }

    const supabase = await createAPIClient(request);

    for (const product of products) {
      const { id, sort_order } = product;

      if (!id || sort_order === undefined) {
        return Response.json({ error: 'Неверный формат данных товара' }, { status: 400 });
      }

      // Используем upsert для обновления или вставки записи
      const result = await supabaseWithRetry(supabase, (client) =>
        client
          .from('category_product_order')
          .upsert({
            category_id: categoryId,
            product_id: id,
            sort_order: sort_order
          }, {
            onConflict: ['category_id', 'product_id'] // Обновляем, если запись уже существует
          })
      ) as { data: any; error: any };

      const { error } = result;

      if (error) {
        // Проверяем, является ли ошибка связанной с отсутствием таблицы
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          console.error('Таблица category_product_order не существует. Пожалуйста, создайте её с помощью миграции.');
          return Response.json({
            error: 'Таблица category_product_order не существует. Обратитесь к администратору для выполнения миграции.'
          }, { status: 500 });
        }

        console.error('Ошибка обновления позиции товара в категории:', error);
        return Response.json({ error: error.message }, { status: 500 });
      }
    }

    // Логируем обновление порядка товаров в категории в аудите
    try {
      await auditService.logUpdate('admin', 'category_product_order', categoryId);
    } catch (auditError) {
      console.error('Ошибка записи в аудит при обновлении порядка товаров в категории:', auditError);
    }

    return Response.json({ success: true });
  } catch (error: any) {
    console.error('Ошибка обновления порядка товаров в категории:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}