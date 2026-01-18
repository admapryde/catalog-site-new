export default function NotFound() {
  return (
    <div className="py-8">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Страница не найдена</h2>
        <p className="text-gray-600 mb-6">Запрошенный URL не существует на этом сайте.</p>
        <a 
          href="/" 
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Вернуться на главную
        </a>
      </div>
    </div>
  );
}