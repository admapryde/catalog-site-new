import { uploadImageToCloudinary } from './src/utils/cloudinary';

// Простой тест для проверки работы Cloudinary
async function testCloudinary() {
  try {
    // Проверим, все ли переменные окружения заданы
    if (!process.env.CLOUDINARY_CLOUD_NAME || 
        !process.env.CLOUDINARY_API_KEY || 
        !process.env.CLOUDINARY_API_SECRET) {
      console.log('Переменные окружения для Cloudinary не заданы. Тест пройден частично.');
      console.log('Для полного теста добавьте CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY и CLOUDINARY_API_SECRET в .env.local');
      return;
    }

    console.log('Переменные окружения Cloudinary заданы. Тест не проводился, т.к. требует реального изображения.');
    console.log('Для полного теста нужно создать Buffer с изображением и вызвать uploadImageToCloudinary()');
  } catch (error) {
    console.error('Ошибка при тестировании Cloudinary:', error);
  }
}

testCloudinary();