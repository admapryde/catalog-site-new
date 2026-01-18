// __tests__/integration/audit-integration.test.ts

import { auditService } from '../../utils/audit-service';

// Мок для Supabase клиента
jest.mock('../../utils/supabase/server', () => ({
  createClient: () => ({
    from: jest.fn(() => ({
      insert: jest.fn(() => ({ error: null })),
      select: jest.fn(() => ({ data: [], error: null })),
      eq: jest.fn(() => ({
        select: jest.fn(() => ({ data: [], error: null }))
      })),
      range: jest.fn(() => ({
        select: jest.fn(() => ({ data: [], error: null }))
      }))
    })),
    auth: {
      getUser: jest.fn(() => ({ 
        data: { user: { id: 'test-user-id', email: 'test@example.com' } }, 
        error: null 
      }))
    }
  })
}));

describe('Интеграционные тесты системы аудита', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Создание записи аудита через сервис', async () => {
    const result = await auditService.logCreate(
      'user-123',
      'Test User',
      'products',
      'product-456'
    );

    expect(result).toBe(true);
  });

  test('Получение записей аудита', async () => {
    const { success, data } = await auditService.getAuditLogs({
      object_type: 'products',
      action: 'Создан'
    });

    expect(success).toBe(true);
    expect(Array.isArray(data)).toBe(true);
  });

  test('Фильтрация записей аудита по дате', async () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    const today = new Date().toISOString();

    const { success, data } = await auditService.getAuditLogs({
      start_date: yesterday,
      end_date: today
    });

    expect(success).toBe(true);
    expect(Array.isArray(data)).toBe(true);
  });

  test('Пагинация записей аудита', async () => {
    const { success, data } = await auditService.getAuditLogs(
      {},
      { limit: 10, offset: 0 }
    );

    expect(success).toBe(true);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeLessThanOrEqual(10);
  });
});