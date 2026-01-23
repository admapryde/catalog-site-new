import { NextRequest } from 'next/server';
import { uploadImageToCloudinary } from '../../../src/utils/cloudinary';
import { updateFavicon, isPngFormat } from '../../../src/utils/favicon-handler';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = formData.get('folder') as string | null;
    const isFavicon = formData.get('isFavicon') === 'true'; // Параметр для указания, что это favicon

    if (!file) {
      return Response.json({ error: 'Файл не предоставлен' }, { status: 400 });
    }

    if (!folder) {
      return Response.json({ error: 'Папка не указана' }, { status: 400 });
    }

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      return Response.json({ error: 'Файл должен быть изображением' }, { status: 400 });
    }

    // Проверка размера файла (максимум 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return Response.json({ error: 'Файл слишком большой. Максимальный размер 2MB' }, { status: 400 });
    }

    // Преобразование File в Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Загрузка изображения в Cloudinary
    const result: any = await uploadImageToCloudinary(buffer, folder);

    // Если это favicon, обновляем файл favicon.png в публичной директории
    if (isFavicon) {
      try {
        // Обновляем favicon в публичной директории
        const faviconUpdated = await updateFavicon(buffer);

        if (!faviconUpdated) {
          console.error('Не удалось обновить favicon в публичной директории');
        }
      } catch (faviconError: any) {
        console.error('Ошибка при обновлении favicon:', faviconError);
        // Не прерываем основной процесс загрузки, если возникла ошибка с favicon
      }
    }

    return Response.json({
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      bytes: result.bytes,
      width: result.width,
      height: result.height
    });
  } catch (error: any) {
    console.error('Ошибка загрузки изображения в Cloudinary:', error);
    return Response.json({ error: error.message || 'Ошибка загрузки изображения' }, { status: 500 });
  }
}