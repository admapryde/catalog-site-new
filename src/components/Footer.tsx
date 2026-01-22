import { FooterSettings } from '@/services/footer-service';
import { GeneralSettings } from '@/services/general-settings-service';

export default function Footer({ settings, generalSettings }: { settings: FooterSettings, generalSettings?: GeneralSettings }) {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Блок Каталог */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-left">
              {settings.footer_catalog_title}
            </h3>
            <p className="text-gray-300">
              {settings.footer_catalog_desc}
            </p>
          </div>

          {/* Блок Контакты */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-left">
              {settings.footer_contacts_title}
            </h3>
            <ul className="space-y-2 text-gray-300">
              {settings.contacts.length > 0 ? (
                settings.contacts.map((contact, index) => (
                  <li key={contact.id || index}>{contact.value}</li>
                ))
              ) : (
                <>
                  <li>📧 info@catalog.example</li>
                  <li>📞 +7 (XXX) XXX-XX-XX</li>
                  <li>📍 Москва, ул. Примерная, д. 1</li>
                </>
              )}
            </ul>
          </div>

          {/* Блок Быстрые ссылки */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-left">
              {settings.footer_quick_links_title}
            </h3>
            <ul className="space-y-2">
              {settings.quick_links.length > 0 ? (
                settings.quick_links.map((link, index) => (
                  <li key={link.id || index}>
                    <a href={link.url} className="text-gray-300 hover:text-white">
                      {link.label}
                    </a>
                  </li>
                ))
              ) : (
                <>
                  <li><a href="/" className="text-gray-300 hover:text-white">Главная</a></li>
                  <li><a href="/catalog" className="text-gray-300 hover:text-white">Каталог</a></li>
                  <li><a href="/about" className="text-gray-300 hover:text-white">О нас</a></li>
                  <li><a href="/contacts" className="text-gray-300 hover:text-white">Контакты</a></li>
                </>
              )}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-400">
          <p>{generalSettings?.site_footer_info || `© ${new Date().getFullYear()} Каталог. Все права защищены.`}</p>
        </div>
      </div>
    </footer>
  );
}