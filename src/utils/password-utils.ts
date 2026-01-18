import bcrypt from 'bcryptjs';

/**
 * Хэширует пароль с использованием bcrypt
 * @param password Пароль для хэширования
 * @param saltRounds Количество раундов соли (по умолчанию 12)
 * @returns Хэшированный пароль
 */
export async function hashPassword(password: string, saltRounds: number = 12): Promise<string> {
  const salt = await bcrypt.genSalt(saltRounds);
  return await bcrypt.hash(password, salt);
}

/**
 * Проверяет пароль на соответствие хэшу
 * @param password Пароль для проверки
 * @param hashedPassword Хэш пароля
 * @returns true если пароль соответствует хэшу, иначе false
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}