import { NextRequest } from 'next/server';
import { createAPIClient, supabaseWithRetry } from '@/lib/supabase-server';
import { auditService } from '@/utils/audit-service';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { blocks } = body;

    if (!Array.isArray(blocks)) {
      return Response.json({ error: 'Массив блоков не предоставлен' }, { status: 400 });
    }

    const supabase = await createAPIClient(request);

    // Обновляем позиции всех блоков за один запрос
    for (const block of blocks) {
      const { id, position } = block;
      
      if (!id || position === undefined) {
        return Response.json({ error: 'Неверный формат данных блока' }, { status: 400 });
      }

      const result = await supabaseWithRetry(supabase, (client) =>
        client
          .from('homepage_blocks')
          .update({ position })
          .eq('id', id)
      ) as { data: any; error: any };

      const { error } = result;

      if (error) {
        console.error('Ошибка обновления позиции блока:', error);
        return Response.json({ error: error.message }, { status: 500 });
      }
    }

    // Логируем обновление порядка блоков главной страницы в аудите
    try {
      await auditService.logUpdate('admin', 'homepage_blocks_order', 'all');
    } catch (auditError) {
      console.error('Ошибка записи в аудит при обновлении порядка блоков главной страницы:', auditError);
    }

    return Response.json({ success: true });
  } catch (error: any) {
    console.error('Ошибка обновления порядка блоков главной страницы:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}