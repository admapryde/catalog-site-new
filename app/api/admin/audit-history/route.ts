import { NextRequest } from 'next/server';
import { auditService } from '@/utils/audit-service';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Проверяем сессию администратора через куки
    const cookiesList = await cookies();
    const adminSessionCookie = cookiesList.get('admin_session');

    if (!adminSessionCookie) {
      // Нет сессии, возвращаем ошибку
      return Response.json({ error: 'Требуется авторизация' }, { status: 401 });
    }

    let adminInfo = null;
    try {
      const sessionData = JSON.parse(decodeURIComponent(adminSessionCookie.value));

      if (!sessionData.userId || !sessionData.username) {
        // Некорректная сессия
        return Response.json({ error: 'Некорректная сессия администратора' }, { status: 401 });
      }

      // Проверяем время жизни сессии (24 часа)
      const sessionAge = Date.now() - sessionData.timestamp;
      if (sessionAge > 24 * 60 * 60 * 1000) { // 24 часа в миллисекундах
        // Сессия истекла
        return Response.json({ error: 'Сессия администратора истекла' }, { status: 401 });
      }

      adminInfo = {
        username: sessionData.username,
        role: sessionData.role
      };
    } catch (e) {
      console.error('Ошибка разбора сессии администратора:', e);
      // Ошибка разбора сессии
      return Response.json({ error: 'Ошибка разбора сессии администратора' }, { status: 401 });
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
    const result = await auditService.getAuditLogs({
      limit,
      offset,
      startDate,
      endDate,
      objectType,
      object_id,
      action,
      userName
    });

    if (result.success) {
      return Response.json({
        success: true,
        data: result.data
      });
    } else {
      return Response.json({
        success: false,
        error: result.error
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