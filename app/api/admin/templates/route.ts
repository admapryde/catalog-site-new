import { NextRequest } from 'next/server';
import { createAPIClient, supabaseWithRetry } from '@/lib/supabase-server';
import { getAdminSession, getAdminSessionFromRequest } from '@/services/admin-auth-service';
import { auditService } from '@/utils/audit-service';
import { cacheManager } from '@/utils/cache-manager';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Кэшируем результаты запросов на 5 минут
const CACHE_DURATION = 5 * 60 * 1000; // 5 минут в миллисекундах

// Create a service role client for admin operations
function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Отсутствуют переменные окружения для Supabase SERVICE ROLE');
  }

  return createSupabaseClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  });
}

export async function GET(request: NextRequest) {
  // Проверяем, что пользователь аутентифицирован как администратор
  const adminUser = await getAdminSession();
  if (!adminUser) {
    return Response.json({ error: 'Требуется аутентификация администратора' }, { status: 401 });
  }

  try {
    // Формируем ключ кэша
    const cacheKey = 'admin_templates';
    const cached = cacheManager.get<any[]>(cacheKey, CACHE_DURATION);

    // Проверяем, есть ли свежие данные в кэше
    if (cached) {
      const response = Response.json(cached);
      response.headers.set('Cache-Control', 'public, max-age=300'); // 5 минут кэширования
      return response;
    }

    // Используем реальный Supabase клиент для API маршрутов
    const supabase = await createAPIClient(request);

    const result = await supabaseWithRetry(supabase, (client) =>
      client
        .from('templates')
        .select(`
          *,
          template_specs(*)
        `)
        .order('created_at', { ascending: false })
    ) as { data: any; error: any };

    const { data, error } = result;

    if (error) {
      console.error('Ошибка получения шаблонов:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Преобразуем данные, чтобы соответствовать ожидаемой структуре
    const transformedData = data.map((item: any) => ({
      ...item,
      specs: item.template_specs || []
    }));

    // Сохраняем результат в кэш
    cacheManager.set(cacheKey, transformedData);

    const response = Response.json(transformedData);
    response.headers.set('Cache-Control', 'public, max-age=300'); // 5 минут кэширования
    return response;
  } catch (error: any) {
    console.error('Ошибка получения шаблонов:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Проверяем, что пользователь аутентифицирован как администратор
    const adminUser = await getAdminSessionFromRequest(request);
    if (!adminUser) {
      return Response.json({ error: 'Требуется аутентификация администратора' }, { status: 401 });
    }

    const body = await request.json();
    const { name, specs } = body;

    // Используем реальный Supabase клиент для API маршрутов
    const supabase = await createAPIClient(request);

    // Создаем шаблон
    const result = await supabaseWithRetry(supabase, (client) =>
      client
        .from('templates')
        .insert([{ name }])
        .select()
        .single()
    ) as { data: any; error: any };

    const { data: templateData, error: templateError } = result;

    if (templateError) {
      // If it's a permission error, try using service role client
      if (templateError.code === '42501' || templateError.message?.includes('permission denied')) {
        console.warn('Permission error detected, using service role client for templates POST');
        const serviceRoleClient = createServiceRoleClient();

        const srResult = await serviceRoleClient
          .from('templates')
          .insert([{ name }])
          .select()
          .single();

        if (srResult.error) {
          return Response.json({ error: srResult.error.message }, { status: 500 });
        }

        const templateId = srResult.data.id;

        // Добавляем характеристики шаблона
        if (specs && specs.length > 0) {
          // Проверяем, что переданные spec_type_id существуют в базе данных
          const specTypeIds = specs.map((spec: any) => spec.spec_type_id).filter(Boolean);

          let validatedSpecs;
          if (specTypeIds.length > 0) {
            const { data: validSpecTypes, error: specTypesCheckError } = await serviceRoleClient
              .from('spec_types')
              .select('id')
              .in('id', specTypeIds);

            if (specTypesCheckError) {
              return Response.json({ error: `Ошибка проверки типов характеристик: ${specTypesCheckError.message}` }, { status: 500 });
            }

            const validSpecTypeIds = validSpecTypes.map((st: any) => st.id);

            // Обновляем спецификации, устанавливая в null некорректные spec_type_id
            validatedSpecs = specs.map((spec: any, index: number) => ({
              template_id: templateId,
              property_name: spec.property_name,
              value: spec.value,
              spec_type_id: spec.spec_type_id && validSpecTypeIds.includes(spec.spec_type_id) ? spec.spec_type_id : null,
              sort_order: index
            }));
          } else {
            // Если нет типов характеристик, просто вставляем без проверки
            validatedSpecs = specs.map((spec: any, index: number) => ({
              template_id: templateId,
              property_name: spec.property_name,
              value: spec.value,
              spec_type_id: null,
              sort_order: index
            }));
          }

          const specsToInsert = validatedSpecs;

          const { error: specsError } = await serviceRoleClient
            .from('template_specs')
            .insert(specsToInsert);

          if (specsError) {
            return Response.json({ error: specsError.message }, { status: 500 });
          }
        }

        // Возвращаем полные данные шаблона
        const { data: fullTemplateData, error: fullTemplateError } = await serviceRoleClient
          .from('templates')
          .select(`
            *,
            template_specs(*)
          `)
          .eq('id', templateId)
          .single();

        if (fullTemplateError) {
          return Response.json({ error: fullTemplateError.message }, { status: 500 });
        }

        // Преобразуем данные, чтобы соответствовать ожидаемой структуре
        const transformedTemplate = {
          ...fullTemplateData,
          specs: fullTemplateData.template_specs || []
        };

        // Логируем создание шаблона в аудите
        try {
          await auditService.logCreate(adminUser.email || 'admin', 'templates', templateId, adminUser.id);
        } catch (auditError) {
          console.error('Ошибка записи в аудит при создании шаблона:', auditError);
        }

        return Response.json(transformedTemplate);
      }

      return Response.json({ error: templateError.message }, { status: 500 });
    }

    const templateId = templateData.id;

    // Добавляем характеристики шаблона
    if (specs && specs.length > 0) {
      // Проверяем, что переданные spec_type_id существуют в базе данных
      const specTypeIds = specs.map((spec: any) => spec.spec_type_id).filter(Boolean);

      let validatedSpecs;
      if (specTypeIds.length > 0) {
        const { data: validSpecTypes, error: specTypesCheckError } = await supabase
          .from('spec_types')
          .select('id')
          .in('id', specTypeIds);

        if (specTypesCheckError) {
          return Response.json({ error: `Ошибка проверки типов характеристик: ${specTypesCheckError.message}` }, { status: 500 });
        }

        const validSpecTypeIds = validSpecTypes.map((st: any) => st.id);

        // Обновляем спецификации, устанавливая в null некорректные spec_type_id
        validatedSpecs = specs.map((spec: any, index: number) => ({
          template_id: templateId,
          property_name: spec.property_name,
          value: spec.value,
          spec_type_id: spec.spec_type_id && validSpecTypeIds.includes(spec.spec_type_id) ? spec.spec_type_id : null,
          sort_order: index
        }));
      } else {
        // Если нет типов характеристик, просто вставляем без проверки
        validatedSpecs = specs.map((spec: any, index: number) => ({
          template_id: templateId,
          property_name: spec.property_name,
          value: spec.value,
          spec_type_id: null,
          sort_order: index
        }));
      }

      const specsToInsert = validatedSpecs;

      const { error: specsError } = await supabase
        .from('template_specs')
        .insert(specsToInsert);

      if (specsError) {
        return Response.json({ error: specsError.message }, { status: 500 });
      }
    }

    // Возвращаем полные данные шаблона
    const { data: fullTemplateData, error: fullTemplateError } = await supabase
      .from('templates')
      .select(`
        *,
        template_specs(*)
      `)
      .eq('id', templateId)
      .single();

    if (fullTemplateError) {
      return Response.json({ error: fullTemplateError.message }, { status: 500 });
    }

    // Преобразуем данные, чтобы соответствовать ожидаемой структуре
    const transformedTemplate = {
      ...fullTemplateData,
      specs: fullTemplateData.template_specs || []
    };

    // Логируем создание шаблона в аудите
    try {
      await auditService.logCreate(adminUser.email || 'admin', 'templates', templateId, adminUser.id);
    } catch (auditError) {
      console.error('Ошибка записи в аудит при создании шаблона:', auditError);
    }

    return Response.json(transformedTemplate);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Проверяем, что пользователь аутентифицирован как администратор
    const adminUser = await getAdminSessionFromRequest(request);
    if (!adminUser) {
      return Response.json({ error: 'Требуется аутентификация администратора' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, specs } = body;

    // Проверяем, что id является валидным UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return Response.json({ error: `Invalid template ID format: ${id}` }, { status: 400 });
    }

    // Используем реальный Supabase клиент для API маршрутов
    const supabase = await createAPIClient(request);

    // Обновляем шаблон
    const result = await supabaseWithRetry(supabase, (client) =>
      client
        .from('templates')
        .update({ name, updated_at: new Date().toISOString() })
        .eq('id', id)
    ) as { data: any; error: any };

    const { error: templateError } = result;

    if (templateError) {
      // If it's a permission error, try using service role client
      if (templateError.code === '42501' || templateError.message?.includes('permission denied')) {
        console.warn('Permission error detected, using service role client for templates update');
        const serviceRoleClient = createServiceRoleClient();

        const srResult = await serviceRoleClient
          .from('templates')
          .update({ name, updated_at: new Date().toISOString() })
          .eq('id', id);

        if (srResult.error) {
          return Response.json({ error: srResult.error.message }, { status: 500 });
        }

        // Удаляем старые характеристики
        await serviceRoleClient
          .from('template_specs')
          .delete()
          .eq('template_id', id);

        // Добавляем новые характеристики
        if (specs && specs.length > 0) {
          // Проверяем, что переданные spec_type_id существуют в базе данных
          const specTypeIds = specs.map((spec: any) => spec.spec_type_id).filter(Boolean);

          let validatedSpecs;
          if (specTypeIds.length > 0) {
            const { data: validSpecTypes, error: specTypesCheckError } = await serviceRoleClient
              .from('spec_types')
              .select('id')
              .in('id', specTypeIds);

            if (specTypesCheckError) {
              return Response.json({ error: `Ошибка проверки типов характеристик: ${specTypesCheckError.message}` }, { status: 500 });
            }

            const validSpecTypeIds = validSpecTypes.map((st: any) => st.id);

            // Обновляем спецификации, устанавливая в null некорректные spec_type_id
            validatedSpecs = specs.map((spec: any, index: number) => ({
              template_id: id,
              property_name: spec.property_name,
              value: spec.value,
              spec_type_id: spec.spec_type_id && validSpecTypeIds.includes(spec.spec_type_id) ? spec.spec_type_id : null,
              sort_order: index
            }));
          } else {
            // Если нет типов характеристик, просто вставляем без проверки
            validatedSpecs = specs.map((spec: any, index: number) => ({
              template_id: id,
              property_name: spec.property_name,
              value: spec.value,
              spec_type_id: null,
              sort_order: index
            }));
          }

          const specsToInsert = validatedSpecs;

          const { error: specsError } = await serviceRoleClient
            .from('template_specs')
            .insert(specsToInsert);

          if (specsError) {
            return Response.json({ error: specsError.message }, { status: 500 });
          }
        }

        // Возвращаем полные данные шаблона
        const { data: fullTemplateData, error: fullTemplateError } = await serviceRoleClient
          .from('templates')
          .select(`
            *,
            template_specs(*)
          `)
          .eq('id', id)
          .single();

        if (fullTemplateError) {
          return Response.json({ error: fullTemplateError.message }, { status: 500 });
        }

        // Преобразуем данные, чтобы соответствовать ожидаемой структуре
        const transformedTemplate = {
          ...fullTemplateData,
          specs: fullTemplateData.template_specs || []
        };

        // Логируем обновление шаблона в аудите
        try {
          await auditService.logUpdate(adminUser.email || 'admin', 'templates', id, adminUser.id);
        } catch (auditError) {
          console.error('Ошибка записи в аудит при обновлении шаблона:', auditError);
        }

        return Response.json(transformedTemplate);
      }

      return Response.json({ error: templateError.message }, { status: 500 });
    }

    // Удаляем старые характеристики
    await supabase
      .from('template_specs')
      .delete()
      .eq('template_id', id);

    // Добавляем новые характеристики
    if (specs && specs.length > 0) {
      // Проверяем, что переданные spec_type_id существуют в базе данных
      const specTypeIds = specs.map((spec: any) => spec.spec_type_id).filter(Boolean);

      let validatedSpecs;
      if (specTypeIds.length > 0) {
        const { data: validSpecTypes, error: specTypesCheckError } = await supabase
          .from('spec_types')
          .select('id')
          .in('id', specTypeIds);

        if (specTypesCheckError) {
          return Response.json({ error: `Ошибка проверки типов характеристик: ${specTypesCheckError.message}` }, { status: 500 });
        }

        const validSpecTypeIds = validSpecTypes.map((st: any) => st.id);

        // Обновляем спецификации, устанавливая в null некорректные spec_type_id
        validatedSpecs = specs.map((spec: any, index: number) => ({
          template_id: id,
          property_name: spec.property_name,
          value: spec.value,
          spec_type_id: spec.spec_type_id && validSpecTypeIds.includes(spec.spec_type_id) ? spec.spec_type_id : null,
          sort_order: index
        }));
      } else {
        // Если нет типов характеристик, просто вставляем без проверки
        validatedSpecs = specs.map((spec: any, index: number) => ({
          template_id: id,
          property_name: spec.property_name,
          value: spec.value,
          spec_type_id: null,
          sort_order: index
        }));
      }

      const specsToInsert = validatedSpecs;

      const { error: specsError } = await supabase
        .from('template_specs')
        .insert(specsToInsert);

      if (specsError) {
        return Response.json({ error: specsError.message }, { status: 500 });
      }
    }

    // Возвращаем полные данные шаблона
    const { data: fullTemplateData, error: fullTemplateError } = await supabase
      .from('templates')
      .select(`
        *,
        template_specs(*)
      `)
      .eq('id', id)
      .single();

    if (fullTemplateError) {
      return Response.json({ error: fullTemplateError.message }, { status: 500 });
    }

    // Преобразуем данные, чтобы соответствовать ожидаемой структуре
    const transformedTemplate = {
      ...fullTemplateData,
      specs: fullTemplateData.template_specs || []
    };

    // Логируем обновление шаблона в аудите
    try {
      await auditService.logUpdate(adminUser.email || 'admin', 'templates', id, adminUser.id);
    } catch (auditError) {
      console.error('Ошибка записи в аудит при обновлении шаблона:', auditError);
    }

    return Response.json(transformedTemplate);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Проверяем, что пользователь аутентифицирован как администратор
    const adminUser = await getAdminSessionFromRequest(request);
    if (!adminUser) {
      return Response.json({ error: 'Требуется аутентификация администратора' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({ error: 'ID шаблона не указан' }, { status: 400 });
    }

    // Используем реальный Supabase клиент для API маршрутов
    const supabase = await createAPIClient(request);

    // Удаляем шаблон (каскадно удалятся связанные характеристики)
    const result = await supabaseWithRetry(supabase, (client) =>
      client
        .from('templates')
        .delete()
        .eq('id', id)
    ) as { data: any; error: any };

    const { error: deleteError } = result;

    if (deleteError) {
      // If it's a permission error, try using service role client
      if (deleteError.code === '42501' || deleteError.message?.includes('permission denied')) {
        console.warn('Permission error detected, using service role client for templates DELETE');
        const serviceRoleClient = createServiceRoleClient();

        const srResult = await serviceRoleClient
          .from('templates')
          .delete()
          .eq('id', id);

        if (srResult.error) {
          return Response.json({ error: srResult.error.message }, { status: 500 });
        }

        // Логируем удаление шаблона в аудите
        try {
          await auditService.logDelete(adminUser.email || 'admin', 'templates', id, adminUser.id);
        } catch (auditError) {
          console.error('Ошибка записи в аудит при удалении шаблона:', auditError);
        }

        return Response.json({ success: true });
      }

      return Response.json({ error: deleteError.message }, { status: 500 });
    }

    // Логируем удаление шаблона в аудите
    try {
      await auditService.logDelete(adminUser.email || 'admin', 'templates', id, adminUser.id);
    } catch (auditError) {
      console.error('Ошибка записи в аудит при удалении шаблона:', auditError);
    }

    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}