// Функция для повторных попыток при ошибках с ограничением частоты
export async function retryOnRateLimit<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Проверяем, является ли ошибка ошибкой ограничения частоты запросов
      if (error?.status === 429 || error?.code === 'over_request_rate_limit') {
        if (i < maxRetries - 1) {
          // Вычисляем задержку с экспоненциальным увеличением (100ms, 200ms, 400ms...)
          const delay = Math.pow(2, i) * 100 + Math.random() * 100; // Добавляем немного рандома
          console.warn(`Ограничение частоты запросов, ждем ${delay}мс перед повторной попыткой ${i + 1}/${maxRetries}`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }

      // Если это другая ошибка или исчерпаны попытки, выбрасываем ошибку
      throw error;
    }
  }

  throw lastError;
}