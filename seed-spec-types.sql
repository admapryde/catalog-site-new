-- Заполнение таблицы типов характеристик базовыми значениями
INSERT INTO spec_types (name, filter_type, data_type, category_id) VALUES
('Диапазон', 'RANGE', 'NUMBER', NULL),
('Чек-бокс', 'CHECKBOXES', 'BOOLEAN', NULL),
('Радио', 'RADIO', 'TEXT', NULL),
('Выпадающий список', 'SELECT', 'TEXT', NULL);