export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-center">Каталог</h3>
            <p className="text-gray-300">
              Универсальная платформа для создания каталогов продукции различных отраслей.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4 text-center">Контакты</h3>
            <ul className="space-y-2 text-gray-300">
              <li>📧 info@catalog.example</li>
              <li>📞 +7 (XXX) XXX-XX-XX</li>
              <li>📍 Москва, ул. Примерная, д. 1</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4 text-center">Быстрые ссылки</h3>
            <ul className="space-y-2">
              <li><a href="/" className="text-gray-300 hover:text-white">Главная</a></li>
              <li><a href="/catalog" className="text-gray-300 hover:text-white">Каталог</a></li>
              <li><a href="/about" className="text-gray-300 hover:text-white">О нас</a></li>
              <li><a href="/contacts" className="text-gray-300 hover:text-white">Контакты</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Каталог. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
}