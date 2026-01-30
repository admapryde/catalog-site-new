import { NextRequest } from 'next/server';
import { createAPIClient, supabaseWithRetry } from '@/lib/supabase-server';
import { getAdminSession, getAdminSessionFromRequest } from '@/services/admin-auth-service';
import { auditService } from '@/utils/audit-service';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

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

export async function POST(request: NextRequest) {
  try {
    // Проверяем, что пользователь аутентифицирован как администратор
    const adminUser = await getAdminSessionFromRequest(request);
    if (!adminUser) {
      return Response.json({ error: 'Требуется аутентификация администратора' }, { status: 401 });
    }

    const body = await request.json();
    const { products } = body;

    if (!Array.isArray(products)) {
      return Response.json({ error: 'Неверный формат данных: ожидается массив продуктов' }, { status: 400 });
    }

    // Используем реальный Supabase клиент для API маршрутов
    const supabase = await createAPIClient(request);

    // Подготовим продукты для вставки
    const productsToInsert = products.map((product: any) => ({
      category_id: product.category_id,
      name: product.name,
      price: product.price,
      description: product.description
    }));

    // Вставляем все продукты за один запрос
    const result = await supabaseWithRetry(supabase, (client) =>
      client
        .from('products')
        .insert(productsToInsert)
        .select('id, category_id, name, price, description, created_at')
    ) as { data: any; error: any };

    const { data: insertedProducts, error: insertError } = result;

    if (insertError) {
      // If it's a permission error, try using service role client
      if (insertError.code === '42501' || insertError.message?.includes('permission denied')) {
        console.warn('Permission error detected, using service role client for products batch import POST');
        const serviceRoleClient = createServiceRoleClient();

        const srResult = await serviceRoleClient
          .from('products')
          .insert(productsToInsert)
          .select('id, category_id, name, price, description, created_at');

        if (srResult.error) {
          console.error('Ошибка при вставке продуктов через service role:', srResult.error);
          return Response.json({ error: srResult.error.message }, { status: 500 });
        }

        const insertedProducts = srResult.data;

        // Подготовим характеристики для вставки
        const allSpecsToInsert = [];
        for (let i = 0; i < products.length; i++) {
          const product = products[i];
          const insertedProduct = insertedProducts[i];

          if (product.specs && Array.isArray(product.specs)) {
            for (const spec of product.specs) {
              allSpecsToInsert.push({
                product_id: insertedProduct.id,
                property_name: spec.property_name,
                value: spec.value,
                spec_type_id: spec.spec_type_id
              });
            }
          }
        }

        // Вставляем все характеристики за один запрос, если есть
        if (allSpecsToInsert.length > 0) {
          const { error: specsInsertError } = await serviceRoleClient
            .from('product_specs')
            .insert(allSpecsToInsert);

          if (specsInsertError) {
            console.error('Ошибка при вставке характеристик:', specsInsertError);
            // В идеале нужно откатить вставленные продукты, но для простоты просто возвращаем ошибку
            return Response.json({ error: specsInsertError.message }, { status: 500 });
          }
        }

        // Возвращаем полные данные всех созданных продуктов
        const productIds = insertedProducts.map((product: any) => product.id);

        const { data: fullProductsData, error: fullProductsError } = await serviceRoleClient
          .from('products')
          .select(`
            *,
            category:categories!inner(id, name),
            product_images(*),
            product_specs(*),
            homepage_section_items!left(section_id),
            category_product_order!left(category_id, product_id, sort_order)
          `)
          .in('id', productIds);

        if (fullProductsError) {
          return Response.json({ error: fullProductsError.message }, { status: 500 });
        }

        // Преобразуем данные, чтобы соответствовать ожидаемой структуре Product
        const transformedProducts = fullProductsData.map((item: any) => {
          // Извлекаем информацию о порядке из вложенного объекта
          const category_product_order = Array.isArray(item.category_product_order) && item.category_product_order.length > 0
            ? item.category_product_order[0]
            : null;

          return {
            ...item,
            images: item.product_images || [],
            specs: item.product_specs || [],
            homepage_section_items: item.homepage_section_items || [],
            category_product_order: category_product_order
          };
        });

        // Логируем создание продуктов в аудите
        try {
          for (const product of transformedProducts) {
            await auditService.logCreate(adminUser.email || 'admin', 'products', product.id, adminUser.id);
          }
        } catch (auditError) {
          console.error('Ошибка записи в аудит при создании продуктов:', auditError);
        }

        return Response.json(transformedProducts);
      }

      console.error('Ошибка при вставке продуктов:', insertError);
      return Response.json({ error: insertError.message }, { status: 500 });
    }

    // Подготовим характеристики для вставки
    const allSpecsToInsert = [];
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const insertedProduct = insertedProducts[i];

      if (product.specs && Array.isArray(product.specs)) {
        for (const spec of product.specs) {
          allSpecsToInsert.push({
            product_id: insertedProduct.id,
            property_name: spec.property_name,
            value: spec.value,
            spec_type_id: spec.spec_type_id
          });
        }
      }
    }

    // Вставляем все характеристики за один запрос, если есть
    if (allSpecsToInsert.length > 0) {
      const { error: specsInsertError } = await supabase
        .from('product_specs')
        .insert(allSpecsToInsert);

      if (specsInsertError) {
        // If it's a permission error, try using service role client
        if (specsInsertError.code === '42501' || specsInsertError.message?.includes('permission denied')) {
          console.warn('Permission error detected, using service role client for product specs batch import POST');
          const serviceRoleClient = createServiceRoleClient();

          const srSpecsResult = await serviceRoleClient
            .from('product_specs')
            .insert(allSpecsToInsert);

          if (srSpecsResult.error) {
            console.error('Ошибка при вставке характеристик через service role:', srSpecsResult.error);
            return Response.json({ error: srSpecsResult.error.message }, { status: 500 });
          }
        } else {
          console.error('Ошибка при вставке характеристик:', specsInsertError);
          // В идеале нужно откатить вставленные продукты, но для простоты просто возвращаем ошибку
          return Response.json({ error: specsInsertError.message }, { status: 500 });
        }
      }
    }

    // Возвращаем полные данные всех созданных продуктов
    const productIds = insertedProducts.map((product: any) => product.id);

    const { data: fullProductsData, error: fullProductsError } = await supabase
      .from('products')
      .select(`
        *,
        category:categories!inner(id, name),
        product_images(*),
        product_specs(*),
        homepage_section_items!left(section_id),
        category_product_order!left(category_id, product_id, sort_order)
      `)
      .in('id', productIds);

    if (fullProductsError) {
      return Response.json({ error: fullProductsError.message }, { status: 500 });
    }

    // Преобразуем данные, чтобы соответствовать ожидаемой структуре Product
    const transformedProducts = fullProductsData.map((item: any) => {
      // Извлекаем информацию о порядке из вложенного объекта
      const category_product_order = Array.isArray(item.category_product_order) && item.category_product_order.length > 0
        ? item.category_product_order[0]
        : null;

      return {
        ...item,
        images: item.product_images || [],
        specs: item.product_specs || [],
        homepage_section_items: item.homepage_section_items || [],
        category_product_order: category_product_order
      };
    });

    // Логируем создание продуктов в аудите
    try {
      for (const product of transformedProducts) {
        await auditService.logCreate(adminUser.email || 'admin', 'products', product.id, adminUser.id);
      }
    } catch (auditError) {
      console.error('Ошибка записи в аудит при создании продуктов:', auditError);
    }

    return Response.json(transformedProducts);
  } catch (error: any) {
    console.error('Ошибка при пакетном импорте продуктов:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}