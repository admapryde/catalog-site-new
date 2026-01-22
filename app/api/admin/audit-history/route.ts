import { NextRequest } from 'next/server';
import { auditService } from '@/utils/audit-service';
import { createAPIClient, supabaseWithRetry } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    // Проверяем сессию администратора через Supabase Auth
    const supabase = await createAPIClient(request);

    const result = await supabaseWithRetry(supabase, async (client) => {
      return await client.auth.getUser();
    });

    const {
      data: { user },
      error,
    } = result;

    if (error || !user) {
      // Нет сессии, возвращаем ошибку
      return Response.json({ error: 'Требуется авторизация' }, { status: 401 });
    }

    // Проверяем, что пользователь является администратором
    const userRole = user.user_metadata?.role || 'user';
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      // Пользователь не является администратором, возвращаем ошибку
      return Response.json({ error: 'Недостаточно прав для просмотра истории действий' }, { status: 403 });
    }

    // Получаем параметры запроса
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const objectType = searchParams.get('objectType') || undefined;
    const object_id = searchParams.get('object_id') || undefined;
    const action = searchParams.get('action') || undefined;
    const userName = searchParams.get('userName') || undefined;

    // Получаем историю аудита
    const auditResult = await auditService.getAuditLogs({
      limit,
      offset,
      startDate,
      endDate,
      objectType,
      object_id,
      action,
      userName
    });

    if (auditResult.success) {
      return Response.json({
        success: true,
        data: auditResult.data
      });
    } else {
      return Response.json({
        success: false,
        error: auditResult.error
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Ошибка в API получения истории аудита:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }, { status: 500 });
  }
}