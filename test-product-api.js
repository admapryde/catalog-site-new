const testProduct = {
  category_id: '1da5042c-4bc2-435e-8a18-9ae4d46c5cc8', // ID первой категории из API
  name: 'Тестовый товар',
  price: 1000,
  images: [
    {
      image_url: 'https://placehold.co/600x600?text=Тест',
      is_main: true
    }
  ],
  specs: [
    {
      property_name: 'Тестовая характеристика',
      value: 'Тестовое значение'
    }
  ]
};

async function testCreateProduct() {
  try {
    console.log('Отправляем запрос на создание товара...');
    const response = await fetch('http://localhost:3000/api/admin/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testProduct)
    });

    console.log('Статус ответа:', response.status);
    const result = await response.json();
    console.log('Ответ от сервера:', result);
  } catch (error) {
    console.error('Ошибка при запросе:', error);
  }
}

testCreateProduct();