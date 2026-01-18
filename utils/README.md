# Утилиты проекта

## Сервис аудита (audit-service.ts)

Сервис аудита предоставляет централизованный способ записи и получения информации о действиях пользователей в системе. Он используется для отслеживания изменений в критических данных и обеспечения возможности аудита действий администраторов.

### Возможности:
- Запись действий пользователей (создание, редактирование, удаление)
- Получение истории действий с фильтрацией и пагинацией
- Автоматическое сохранение метаданных (IP-адрес, user agent)
- Интеграция с системой аутентификации Supabase

### Использование:
```typescript
import { auditService } from '@/utils/audit-service';

// Запись действия создания
await auditService.logCreate(userId, userName, objectType, objectId);

// Запись действия обновления
await auditService.logUpdate(userId, userName, objectType, objectId);

// Запись действия удаления
await auditService.logDelete(userId, userName, objectType, objectId);

// Получение истории с фильтрацией
const { success, data } = await auditService.getAuditLogs({
  object_type: 'products',
  action: 'Создан'
});
```

### Зависимости:
- `@/utils/supabase/server` - клиент Supabase для взаимодействия с базой данных