import fs from 'fs/promises';
import path from 'path';

// Глобальная переменная для хранения времени последнего обновления favicon
declare global {
  var lastFaviconUpdate: number | undefined;
}

if (!global.lastFaviconUpdate) {
  global.lastFaviconUpdate = Date.now();
}

/**
 * Обновляет favicon.png в публичной директории
 * @param buffer - буфер изображения
 * @returns boolean - успешно ли обновлена favicon
 */
export async function updateFavicon(buffer: Buffer): Promise<boolean> {
  try {
    // Путь к публичной директории
    const publicDir = path.join(process.cwd(), 'public');

    // Проверяем, существует ли публичная директория
    await fs.access(publicDir);

    // Путь к favicon.png
    const faviconPath = path.join(publicDir, 'favicon.png');

    // Сохраняем новый favicon
    await fs.writeFile(faviconPath, buffer);

    // Обновляем время модификации файла, чтобы избежать кэширования
    const now = new Date();
    await fs.utimes(faviconPath, now, now);

    // Обновляем глобальную переменную времени последнего обновления
    global.lastFaviconUpdate = Date.now();

    console.log('Favicon успешно обновлен в публичной директории как favicon.png');
    return true;
  } catch (error) {
    console.error('Ошибка при обновлении favicon:', error);
    return false;
  }
}

/**
 * Проверяет, является ли файл изображением в формате PNG
 * @param buffer - буфер файла
 * @returns boolean - является ли файл PNG
 */
export function isPngFormat(buffer: Buffer): boolean {
  // Проверяем сигнатуру файла PNG (первые 8 байт)
  if (buffer.length < 8) return false;

  const pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
  for (let i = 0; i < pngSignature.length; i++) {
    if (buffer[i] !== pngSignature[i]) {
      return false;
    }
  }
  return true;
}