'use server';

import { redirect } from 'next/navigation';
import { adminLogin } from './admin-login-action';

export async function loginAction(formData: FormData) {
  const result = await adminLogin(formData, true); // Выполняем редирект при успехе

  // Если мы дошли до этой строки, это означает, что редирект не был выполнен
  // и, следовательно, должна быть ошибка
  if (result.error) {
    // Если произошла ошибка, перенаправляем обратно на страницу логина с сообщением об ошибке
    redirect(`/login?error=${encodeURIComponent(result.error)}`);
  }
}