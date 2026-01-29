import { NextRequest } from 'next/server';

// Функциональность макетов главной страницы была удалена.
// Все операции с макетами теперь возвращают ошибку.

export async function GET(request: NextRequest) {
  return Response.json({ error: 'Функциональность макетов главной страницы была удалена. Используйте только управление блоками.' }, { status: 410 }); // 410 Gone
}

export async function POST(request: NextRequest) {
  return Response.json({ error: 'Функциональность макетов главной страницы была удалена. Используйте только управление блоками.' }, { status: 410 }); // 410 Gone
}

export async function PUT(request: NextRequest) {
  return Response.json({ error: 'Функциональность макетов главной страницы была удалена. Используйте только управление блоками.' }, { status: 410 }); // 410 Gone
}

export async function DELETE(request: NextRequest) {
  return Response.json({ error: 'Функциональность макетов главной страницы была удалена. Используйте только управление блоками.' }, { status: 410 }); // 410 Gone
}