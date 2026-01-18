// __tests__/audit-service.test.ts

import { auditService, AuditLogData } from '../utils/audit-service';

// Мок для Supabase клиента
jest.mock('../utils/supabase/server', () => ({
  createClient: () => ({
    from: jest.fn(() => ({
      insert: jest.fn(() => ({ error: null })),
      select: jest.fn(() => ({ data: [], error: null }))
    }))
  })
}));

describe('AuditService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should log action successfully', async () => {
    const logData: AuditLogData = {
      user_id: 'user-123',
      user_name: 'Test User',
      object_type: 'products',
      object_id: 'product-456',
      action: 'Создан',
      ip_address: '192.168.1.1',
      user_agent: 'Mozilla/5.0...',
      metadata: { price: 100 }
    };

    const result = await auditService.logAction(logData);

    expect(result).toBe(true);
  });

  test('should handle error when logging action', async () => {
    // Мок для ошибки при вставке
    const mockInsert = require('../utils/supabase/server').createClient().from().insert;
    mockInsert.mockReturnValueOnce({ error: { message: 'Database error' } });

    const logData: AuditLogData = {
      user_id: 'user-123',
      user_name: 'Test User',
      object_type: 'products',
      object_id: 'product-456',
      action: 'Создан'
    };

    const result = await auditService.logAction(logData);

    expect(result).toBe(false);
  });

  test('should log create action', async () => {
    const spy = jest.spyOn(auditService, 'logAction');

    await auditService.logCreate('user-123', 'Test User', 'products', 'product-456');

    expect(spy).toHaveBeenCalledWith({
      user_id: 'user-123',
      user_name: 'Test User',
      object_type: 'products',
      object_id: 'product-456',
      action: 'Создан'
    });
  });

  test('should log update action', async () => {
    const spy = jest.spyOn(auditService, 'logAction');

    await auditService.logUpdate('user-123', 'Test User', 'products', 'product-456');

    expect(spy).toHaveBeenCalledWith({
      user_id: 'user-123',
      user_name: 'Test User',
      object_type: 'products',
      object_id: 'product-456',
      action: 'Отредактирован'
    });
  });

  test('should log delete action', async () => {
    const spy = jest.spyOn(auditService, 'logAction');

    await auditService.logDelete('user-123', 'Test User', 'products', 'product-456');

    expect(spy).toHaveBeenCalledWith({
      user_id: 'user-123',
      user_name: 'Test User',
      object_type: 'products',
      object_id: 'product-456',
      action: 'Удалён'
    });
  });
});