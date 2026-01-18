import { auditService } from '@/utils/audit-service';

async function testAuditSystem() {
  console.log('Тестируем систему аудита...');

  try {
    // Тестируем запись различных действий
    console.log('Добавляем тестовые записи в аудит...');
    
    const createResult = await auditService.logCreate('admin', 'products', 'prod-123');
    console.log('Результат создания:', createResult);
    
    const updateResult = await auditService.logUpdate('admin', 'categories', 'cat-456');
    console.log('Результат обновления:', updateResult);
    
    const deleteResult = await auditService.logDelete('admin', 'banners', 'banner-789');
    console.log('Результат удаления:', deleteResult);

    // Получаем последние записи
    console.log('Получаем последние записи аудита...');
    const logsResult = await auditService.getAuditLogs({ limit: 10 });
    
    if (logsResult.success && logsResult.data) {
      console.log('Полученные записи аудита:');
      logsResult.data.forEach(log => {
        console.log(`- ${log.created_at}: ${log.user_name} ${log.action} ${log.object_type} ${log.object_id || ''}`);
      });
    } else {
      console.error('Ошибка получения записей:', logsResult.error);
    }
  } catch (error) {
    console.error('Ошибка в тесте системы аудита:', error);
  }
}

// Экспортируем функцию для использования в других модулях
export { testAuditSystem };

// Если файл запускается напрямую, выполнить тест
if (typeof require !== 'undefined' && require.main === module) {
  testAuditSystem().catch(console.error);
}