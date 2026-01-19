// Типы для категорий
export interface Category {
  id: string;
  name: string;
  image_url: string;
  sort_order: number;
}

// Типы для групп баннеров
export interface BannerGroup {
  id: string;
  title: string;
  position: number;
}

// Типы для баннеров
export interface Banner {
  id: string;
  group_id: string;
  image_url: string;
  link_url: string;
  sort_order: number;
}

// Типы для продуктов
export interface Product {
  id: string;
  category_id: string;
  name: string;
  price: number;
  description?: string;
}

// Типы для изображений продуктов
export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  is_main: boolean;
}

// Типы для характеристик продуктов
export interface ProductSpec {
  id: string;
  product_id: string;
  property_name: string;
  value: string;
  spec_type_id?: string; // ID типа характеристики
  spec_type?: 'SELECT' | 'CHECKBOXES' | 'RADIO' | 'RANGE'; // Тип фильтра
}

// Тип для типа характеристики
export interface SpecType {
  id: string;
  name: string;
  filter_type: 'SELECT' | 'CHECKBOXES' | 'RADIO' | 'RANGE';
  data_type: 'TEXT' | 'NUMBER' | 'BOOLEAN';
  category_id: string | null;
  category_name: string;
  created_at: string;
  updated_at: string;
}

// Интерфейс для типа характеристики с возможными значениями
export interface SpecTypeWithValues {
  property_name: string; // Название характеристики
  spec_type: 'SELECT' | 'CHECKBOXES' | 'RADIO' | 'RANGE'; // Тип фильтра
  available_values: string[]; // Возможные значения для фильтрации
}

// Типы для разделов ГС
export interface HomepageSection {
  id: string;
  title: string;
  position: number;
  created_at: string;
  updated_at: string;
}

// Типы для элементов разделов ГС
export interface HomepageSectionItem {
  id: string;
  section_id: string;
  product_id: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Комплексный тип для детального представления продукта
export interface ProductDetail extends Product {
  category: Category;
  images: ProductImage[];
  specs: ProductSpec[];
}

// Тип для фильтров
export interface FilterState {
  category_id?: string;
  price_from?: number;
  price_to?: number;
  spec_filters: Record<string, string[]>; // property_name -> values
}

// Обновим интерфейс Product, чтобы включить изображения и характеристики
export interface Product {
  id: string;
  category_id: string;
  name: string;
  price: number;
  description?: string;
  images?: ProductImage[];
  specs?: ProductSpec[];
  homepage_section_items?: Array<{ section_id: string }>;
}