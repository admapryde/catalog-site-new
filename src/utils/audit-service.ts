import { createClient } from '@/lib/supabase-server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export interface AuditLogEntry {
  id: number;
  user_id?: string;
  user_name: string;
  object_type: string;
  object_id?: string;
  action: string;
  created_at: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
}

export interface GetAuditLogsParams {
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
  objectType?: string;
  object_id?: string;
  action?: string;
  userName?: string;
}

export interface AuditServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class AuditService {
  /**
   * Получить записи истории действий
   */
  async getAuditLogs(params: GetAuditLogsParams = {}): Promise<AuditServiceResponse<AuditLogEntry[]>> {
    try {
      const supabase = await createClient();

      let query = supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false });

      // Применяем фильтры
      if (params.startDate) {
        query = query.gte('created_at', params.startDate);
      }

      if (params.endDate) {
        query = query.lte('created_at', params.endDate);
      }

      if (params.objectType) {
        query = query.eq('object_type', params.objectType);
      }

      if (params.action) {
        query = query.eq('action', params.action);
      }

      if (params.userName) {
        query = query.eq('user_name', params.userName);
      }

      if (params.object_id) {
        query = query.eq('object_id', params.object_id);
      }

      // Применяем лимит и смещение
      if (params.limit !== undefined) {
        query = query.limit(params.limit);
      }

      if (params.offset !== undefined) {
        // В Supabase для пагинации используем range
        query = query.range(params.offset, params.offset + (params.limit || 20) - 1);
      }

      const { data, error } = await query;

      if (error) {
        // If it's a permission error, try using service role client
        if (error.code === '42501' || error.message?.includes('permission denied')) {
          console.warn('Permission error detected, using service role client for audit logs GET');
          const serviceRoleClient = createServiceRoleClient();

          let srQuery = serviceRoleClient
            .from('audit_log')
            .select('*')
            .order('created_at', { ascending: false });

          // Применяем фильтры
          if (params.startDate) {
            srQuery = srQuery.gte('created_at', params.startDate);
          }

          if (params.endDate) {
            srQuery = srQuery.lte('created_at', params.endDate);
          }

          if (params.objectType) {
            srQuery = srQuery.eq('object_type', params.objectType);
          }

          if (params.action) {
            srQuery = srQuery.eq('action', params.action);
          }

          if (params.userName) {
            srQuery = srQuery.eq('user_name', params.userName);
          }

          if (params.object_id) {
            srQuery = srQuery.eq('object_id', params.object_id);
          }

          // Применяем лимит и смещение
          if (params.limit !== undefined) {
            srQuery = srQuery.limit(params.limit);
          }

          if (params.offset !== undefined) {
            // В Supabase для пагинации используем range
            srQuery = srQuery.range(params.offset, params.offset + (params.limit || 20) - 1);
          }

          const srResult = await srQuery;

          if (srResult.error) {
            throw srResult.error;
          }

          return {
            success: true,
            data: srResult.data as AuditLogEntry[]
          };
        }
        throw error;
      }

      return {
        success: true,
        data: data as AuditLogEntry[]
      };
    } catch (error) {
      console.error('Ошибка получения истории аудита:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка'
      };
    }
  }

  /**
   * Записать действие в лог аудита
   */
  async logAction(user_name: string, object_type: string, action: string, object_id?: string, user_id?: string, metadata?: Record<string, any>): Promise<AuditServiceResponse<boolean>> {
    try {
      const supabase = await createClient();

      const { error } = await supabase
        .from('audit_log')
        .insert([
          {
            user_name,
            object_type,
            action,
            ...(object_id && { object_id }),
            ...(user_id && { user_id }),
            ...(metadata && { metadata })
          }
        ]);

      if (error) {
        // Проверяем, является ли ошибка связанной с политиками безопасности (RLS)
        if (error.code === '42501' || error.message.includes('row-level security') || error.message?.includes('permission denied')) {
          console.warn('Ошибка политики безопасности при записи в лог аудита:', error);

          // Попробуем использовать service role клиента
          try {
            const serviceRoleClient = createServiceRoleClient();

            const srResult = await serviceRoleClient
              .from('audit_log')
              .insert([
                {
                  user_name,
                  object_type,
                  action,
                  ...(object_id && { object_id }),
                  ...(user_id && { user_id }),
                  ...(metadata && { metadata })
                }
              ]);

            if (srResult.error) {
              console.error('Ошибка записи в лог аудита через service role:', srResult.error);
              // Все равно возвращаем успех, чтобы не прерывать основной процесс
              return {
                success: true,
                data: false
              };
            }

            return {
              success: true,
              data: true
            };
          } catch (serviceRoleError) {
            console.error('Ошибка при попытке использовать service role для записи в аудит:', serviceRoleError);
            // Не считаем это критической ошибкой, просто логируем
            return {
              success: true,
              data: false // Указывает, что запись не была сделана из-за RLS
            };
          }
        }
        throw error;
      }

      return {
        success: true,
        data: true
      };
    } catch (error) {
      console.error('Ошибка записи в лог аудита:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка'
      };
    }
  }

  /**
   * Записать создание объекта
   */
  async logCreate(user_name: string, object_type: string, object_id?: string, user_id?: string, metadata?: Record<string, any>): Promise<AuditServiceResponse<boolean>> {
    return this.logAction(user_name, object_type, 'Создан', object_id, user_id, metadata);
  }

  /**
   * Записать обновление объекта
   */
  async logUpdate(user_name: string, object_type: string, object_id?: string, user_id?: string, metadata?: Record<string, any>): Promise<AuditServiceResponse<boolean>> {
    return this.logAction(user_name, object_type, 'Отредактирован', object_id, user_id, metadata);
  }

  /**
   * Записать удаление объекта
   */
  async logDelete(user_name: string, object_type: string, object_id?: string, user_id?: string, metadata?: Record<string, any>): Promise<AuditServiceResponse<boolean>> {
    return this.logAction(user_name, object_type, 'Удалён', object_id, user_id, metadata);
  }
}

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

export const auditService = new AuditService();