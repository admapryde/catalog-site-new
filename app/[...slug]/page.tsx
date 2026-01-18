import { notFound } from 'next/navigation';

// Обработка всех несуществующих маршрутов
export default function CatchAllPage() {
  // Для всех маршрутов, которые не совпадают с другими маршрутами, возвращаем 404
  notFound();
}