import cloudinary from 'cloudinary';

// Инициализация Cloudinary с использованием переменных окружения
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Тип для опций загрузки
type UploadApiOptions = {
  folder?: string;
  resource_type?: 'image' | 'video' | 'raw';
  public_id?: string;
  overwrite?: boolean;
  invalidate?: boolean;
  type?: string;
};

/**
 * Загружает изображение в Cloudinary
 * @param fileBuffer - буфер файла изображения
 * @param folder - папка в Cloudinary, куда загружается изображение
 * @returns объект с информацией о загруженном изображении
 */
export const uploadImageToCloudinary = async (
  fileBuffer: Buffer,
  folder: string,
  publicId?: string
) => {
  return new Promise((resolve, reject) => {
    const uploadOptions: UploadApiOptions = {
      folder,
      resource_type: 'image',
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
    }

    cloudinary.v2.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    }).end(fileBuffer);
  });
};

/**
 * Удаляет изображение из Cloudinary
 * @param publicId - публичный ID изображения в Cloudinary
 */
export const deleteImageFromCloudinary = async (publicId: string) => {
  return cloudinary.v2.uploader.destroy(publicId);
};

export default cloudinary.v2;