// Mock-реализация менеджера сессий для тестирования
// В продакшене будет использоваться полноценная система аутентификации

class MockSessionManager {
  private sessions: Map<string, { email: string; createdAt: number }> = new Map();

  /**
   * Создает новую сессию
   * @param email Email пользователя
   * @returns ID сессии
   */
  createSession(email: string): string {
    const sessionId = this.generateSessionId();
    this.sessions.set(sessionId, {
      email,
      createdAt: Date.now()
    });
    
    return sessionId;
  }

  /**
   * Получает данные сессии по ID
   * @param sessionId ID сессии
   * @returns Данные сессии или null
   */
  getSession(sessionId: string) {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return null;
    }

    // Проверяем, не истекло ли время сессии (24 часа)
    const age = Date.now() - session.createdAt;
    if (age > 24 * 60 * 60 * 1000) { // 24 часа в миллисекундах
      this.sessions.delete(sessionId);
      return null;
    }

    return session;
  }

  /**
   * Удаляет сессию
   * @param sessionId ID сессии
   */
  destroySession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * Генерирует случайный ID сессии
   * @returns Случайный строковый ID
   */
  private generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
}

// Экспортируем экземпляр менеджера сессий
export const mockSessionManager = new MockSessionManager();