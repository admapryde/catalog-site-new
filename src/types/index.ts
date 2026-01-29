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
  section_type?: string; // Добавляем тип раздела для специальных случаев
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

// Типы для шаблонов
export interface Template {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface TemplateWithSpecs extends Template {
  specs: TemplateSpec[];
}

export interface TemplateSpec {
  id: string;
  template_id: string;
  property_name: string;
  value: string;
  spec_type_id?: string;
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

// Тип для настроек шапки сайта
export interface HeaderSettings {
  header_title: string;
  nav_home: string;
  nav_catalog: string;
  nav_about: string;
  nav_contacts: string;
  contact: string;
  logo_image_url: string;
}

// Типы для страниц
export interface Page {
  id: string;
  title: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface PageBlock {
  id: string;
  page_id: string;
  block_type: 'text' | 'photo' | 'links';
  title: string;
  content?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PageBlockImage {
  id: string;
  block_id: string;
  image_url: string;
  layout_type: 'simple' | 'banner' | 'horizontal_pair' | 'horizontal_triple' | 'grid_four' | 'image_text_side';
  text_content?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PageBlockLink {
  id: string;
  block_id: string;
  title: string;
  url: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Тип для связи категории и товара с порядком
export interface CategoryProductOrder {
  sort_order: number;
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
  category_product_order?: CategoryProductOrder;
}