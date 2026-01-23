/**
 * Функция debounce для ограничения частоты вызова функции
 * @param func Функция, которую нужно ограничить по частоте вызовов
 * @param delay Задержка в миллисекундах
 * @returns Функция с примененным debounce
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>): void => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
}