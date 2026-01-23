import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';

/**
 * Создает favicon.ico по умолчанию, если он не существует
 */
export async function ensureFaviconExists(): Promise<void> {
  try {
    // Путь к публичной директории
    const publicDir = path.join(process.cwd(), 'public');
    
    // Путь к favicon.ico
    const faviconPath = path.join(publicDir, 'favicon.ico');
    
    // Проверяем, существует ли favicon.ico
    try {
      await fs.access(faviconPath);
      console.log('Favicon.ico уже существует');
      return;
    } catch {
      // Файл не существует, создаем его из существующего изображения
      console.log('Favicon.ico не найден, создаем файл из существующего изображения');
      
      // Ищем подходящее изображение для создания favicon
      const files = await fs.readdir(publicDir);
      const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif'];
      const imageFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return imageExtensions.includes(ext);
      });
      
      if (imageFiles.length > 0) {
        // Используем первое найденное изображение
        const imagePath = path.join(publicDir, imageFiles[0]);
        
        // Проверяем, установлен ли ImageMagick (для конвертации)
        const hasConvert = await checkForImageMagick();
        
        if (hasConvert) {
          // Используем ImageMagick для конвертации
          await convertToFaviconWithImageMagick(imagePath, faviconPath);
        } else {
          // Если ImageMagick не установлен, создаем простой ICO файл
          await createSimpleFavicon(faviconPath);
        }
      } else {
        // Если нет изображений, создаем простой favicon.ico
        await createSimpleFavicon(faviconPath);
      }
    }
  } catch (error) {
    console.error('Ошибка при проверке/создании favicon.ico:', error);
  }
}

/**
 * Проверяет наличие ImageMagick
 */
async function checkForImageMagick(): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn('which', ['convert']);
    child.on('close', (code) => {
      resolve(code === 0);
    });
  });
}

/**
 * Конвертирует изображение в favicon.ico с помощью ImageMagick
 */
async function convertToFaviconWithImageMagick(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('convert', [
      inputPath,
      '-define', 'icon:auto-resize=16,32,48',
      outputPath
    ]);
    
    child.on('error', (error) => {
      console.error('Ошибка при конвертации изображения в favicon:', error);
      reject(error);
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log('Favicon.ico успешно создан из', path.basename(inputPath));
        resolve();
      } else {
        console.error('Ошибка при конвертации изображения в favicon, код:', code);
        reject(new Error(`Конвертация завершилась с кодом ${code}`));
      }
    });
  });
}

/**
 * Создает простой favicon.ico файл
 */
async function createSimpleFavicon(outputPath: string): Promise<void> {
  // Создаем простой ICO файл с минимальными данными
  // Это будет минимальный ICO файл, который браузеры распознают
  
  // В реальном приложении вы бы использовали нормальный ICO файл
  // или конвертировали изображение с помощью подходящей библиотеки
  
  // Для демонстрации создадим простой ICO файл
  const icoData = Buffer.from([
    0x00, 0x00,       // ICO signature (0)
    0x01, 0x00,       // ICO type (1)
    0x01, 0x00,       // Number of images (1)
    
    // First image entry
    0x10,             // Width (16px)
    0x10,             // Height (16px)
    0x00,             // Colors (0 = no palette)
    0x00,             // Reserved
    0x01, 0x00,       // Color planes
    0x20, 0x00,       // Bits per pixel (32)
    0x86, 0x02, 0x00, 0x00, // Size of image data (646 bytes)
    0x16, 0x00, 0x00, 0x00, // Offset of image data (22 bytes)
    
    // Image data would go here, but we'll just create a minimal file
  ]);
  
  await fs.writeFile(outputPath, icoData);
  console.log('Создан простой favicon.ico файл по умолчанию');
}