-- Заполнение таблицы категорий
INSERT INTO categories (name, image_url, sort_order) VALUES
('Гостиные', 'https://placehold.co/300x300?text=Гостиные', 1),
('Спальни', 'https://placehold.co/300x300?text=Спальни', 2),
('Кухни', 'https://placehold.co/300x300?text=Кухни', 3),
('Офис', 'https://placehold.co/300x300?text=Офис', 4),
('Детские', 'https://placehold.co/300x300?text=Детские', 5),
('Прихожие', 'https://placehold.co/300x300?text=Прихожие', 6),
('Комоды', 'https://placehold.co/300x300?text=Комоды', 7),
('Столы', 'https://placehold.co/300x300?text=Столы', 8),
('Стулья', 'https://placehold.co/300x300?text=Стулья', 9),
('Мягкая мебель', 'https://placehold.co/300x300?text=Мягкая+мебель', 10),
('Освещение', 'https://placehold.co/300x300?text=Освещение', 11),
('Аксессуары', 'https://placehold.co/300x300?text=Аксессуары', 12),
('Текстиль', 'https://placehold.co/300x300?text=Текстиль', 13),
('Садовая мебель', 'https://placehold.co/300x300?text=Садовая+мебель', 14),
('Шкафы', 'https://placehold.co/300x300?text=Шкафы', 15),
('Кровати', 'https://placehold.co/300x300?text=Кровати', 16);

-- Заполнение таблицы групп баннеров
INSERT INTO banner_groups (title, position) VALUES
('Акционные предложения', 1),
('Новинки', 2),
('Хиты продаж', 3);

-- Заполнение таблицы баннеров
INSERT INTO banners (group_id, image_url, link_url, sort_order) VALUES
((SELECT id FROM banner_groups WHERE title = 'Акционные предложения'), 'https://placehold.co/800x300?text=Акция+1', '/catalog/1', 1),
((SELECT id FROM banner_groups WHERE title = 'Акционные предложения'), 'https://placehold.co/800x300?text=Акция+2', '/catalog/2', 2),
((SELECT id FROM banner_groups WHERE title = 'Новинки'), 'https://placehold.co/800x300?text=Новинка+1', '/catalog/3', 1),
((SELECT id FROM banner_groups WHERE title = 'Новинки'), 'https://placehold.co/800x300?text=Новинка+2', '/catalog/4', 2),
((SELECT id FROM banner_groups WHERE title = 'Хиты продаж'), 'https://placehold.co/800x300?text=Хит+1', '/catalog/5', 1),
((SELECT id FROM banner_groups WHERE title = 'Хиты продаж'), 'https://placehold.co/800x300?text=Хит+2', '/catalog/6', 2);

-- Заполнение таблицы продуктов
INSERT INTO products (category_id, name, price) VALUES
((SELECT id FROM categories WHERE name = 'Гостиные'), 'Угловой диван "Комфорт"', 45000.00),
((SELECT id FROM categories WHERE name = 'Гостиные'), 'Журнальный столик "Модерн"', 8500.00),
((SELECT id FROM categories WHERE name = 'Спальни'), 'Кровать "Сон"', 32000.00),
((SELECT id FROM categories WHERE name = 'Спальни'), 'Тумбочка прикроватная', 5200.00),
((SELECT id FROM categories WHERE name = 'Кухни'), 'Кухонный гарнитур "Минимализм"', 78000.00),
((SELECT id FROM categories WHERE name = 'Кухни'), 'Барная стойка', 15000.00),
((SELECT id FROM categories WHERE name = 'Офис'), 'Офисное кресло "Эргономика"', 12000.00),
((SELECT id FROM categories WHERE name = 'Офис'), 'Письменный стол', 18000.00),
((SELECT id FROM categories WHERE name = 'Детские'), 'Детская кровать "Сказка"', 22000.00),
((SELECT id FROM categories WHERE name = 'Детские'), 'Игровой шкаф', 11000.00);

-- Заполнение таблицы изображений продуктов
INSERT INTO product_images (product_id, image_url, is_main) VALUES
((SELECT id FROM products WHERE name = 'Угловой диван "Комфорт"'), 'https://placehold.co/600x600?text=Диван+1', true),
((SELECT id FROM products WHERE name = 'Угловой диван "Комфорт"'), 'https://placehold.co/600x600?text=Диван+2', false),
((SELECT id FROM products WHERE name = 'Журнальный столик "Модерн"'), 'https://placehold.co/600x600?text=Столик+1', true),
((SELECT id FROM products WHERE name = 'Кровать "Сон"'), 'https://placehold.co/600x600?text=Кровать+1', true),
((SELECT id FROM products WHERE name = 'Тумбочка прикроватная'), 'https://placehold.co/600x600?text=Тумбочка+1', true),
((SELECT id FROM products WHERE name = 'Кухонный гарнитур "Минимализм"'), 'https://placehold.co/600x600?text=Кухня+1', true),
((SELECT id FROM products WHERE name = 'Барная стойка'), 'https://placehold.co/600x600?text=Бар+1', true),
((SELECT id FROM products WHERE name = 'Офисное кресло "Эргономика"'), 'https://placehold.co/600x600?text=Кресло+1', true),
((SELECT id FROM products WHERE name = 'Письменный стол'), 'https://placehold.co/600x600?text=Стол+1', true),
((SELECT id FROM products WHERE name = 'Детская кровать "Сказка"'), 'https://placehold.co/600x600?text=Детская+1', true);

-- Заполнение таблицы характеристик продуктов
INSERT INTO product_specs (product_id, property_name, value) VALUES
((SELECT id FROM products WHERE name = 'Угловой диван "Комфорт"'), 'Материал обивки', 'Ткань'),
((SELECT id FROM products WHERE name = 'Угловой диван "Комфорт"'), 'Материал каркаса', 'Дерево'),
((SELECT id FROM products WHERE name = 'Угловой диван "Комфорт"'), 'Цвет', 'Серый'),
((SELECT id FROM products WHERE name = 'Угловой диван "Комфорт"'), 'Ширина', '220 см'),
((SELECT id FROM products WHERE name = 'Угловой диван "Комфорт"'), 'Глубина', '90 см'),
((SELECT id FROM products WHERE name = 'Кровать "Сон"'), 'Материал', 'Массив дерева'),
((SELECT id FROM products WHERE name = 'Кровать "Сон"'), 'Размер', '160x200 см'),
((SELECT id FROM products WHERE name = 'Кровать "Сон"'), 'Цвет', 'Венге'),
((SELECT id FROM products WHERE name = 'Кухонный гарнитур "Минимализм"'), 'Материал фасадов', 'МДФ'),
((SELECT id FROM products WHERE name = 'Кухонный гарнитур "Минимализм"'), 'Цвет', 'Белый глянец'),
((SELECT id FROM products WHERE name = 'Кухонный гарнитур "Минимализм"'), 'Количество секций', '8');

-- Заполнение таблицы настроек сайта
INSERT INTO site_settings (setting_key, setting_value) VALUES
('site_name', 'Универсальный каталог'),
('site_logo', '/logo.png'),
('footer_info', '© 2023 Универсальный каталог. Все права защищены.'),
('contact_email', 'info@catalog.example'),
('contact_phone', '+7 (XXX) XXX-XX-XX');