/**
 * Извлекает public_id из URL изображения Cloudinary
 * @param url - URL изображения в Cloudinary
 * @returns public_id изображения или null, если не удалось извлечь
 */
export const extractPublicIdFromCloudinaryUrl = (url: string): string | null => {
  if (!url || !url.includes('res.cloudinary.com')) {
    return null;
  }

  try {
    // Регулярное выражение для извлечения public_id из URL Cloudinary
    // Поддерживает различные форматы URL Cloudinary
    const regex = /(?:https?:\/\/)?(?:[^\/]+\.)?res\.cloudinary\.com\/[^\/]+\/[^\/]+\/[^\/]+\/(.+)\.(?:jpg|jpeg|png|gif|webp|bmp|tiff|svg|ico)/i;
    const match = url.match(regex);
    
    if (match && match[1]) {
      // Извлекаем путь к изображению, исключая возможные версии (v1234567890)
      const fullPath = match[1];
      const pathParts = fullPath.split('/');
      
      // Если в пути есть версия (начинается с 'v' и за которой следуют цифры), убираем её
      const publicId = pathParts.filter(part => !/^v\d+$/.test(part)).join('/');
      
      return publicId;
    }
    
    return null;
  } catch (error) {
    console.error('Ошибка при извлечении public_id из URL Cloudinary:', error);
    return null;
  }
};

/**
 * Удаляет изображение из Cloudinary по URL
 * @param url - URL изображения в Cloudinary
 * @returns результат удаления
 */
export const deleteImageFromCloudinaryByUrl = async (url: string) => {
  const publicId = extractPublicIdFromCloudinaryUrl(url);
  
  if (!publicId) {
    console.warn(`Не удалось извлечь public_id из URL: ${url}`);
    return null;
  }
  
  try {
    const { deleteImageFromCloudinary } = await import('./cloudinary');
    return await deleteImageFromCloudinary(publicId);
  } catch (error) {
    console.error(`Ошибка при удалении изображения из Cloudinary по URL ${url}:`, error);
    return null;
  }
};