'use client';

import { useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser-client';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState(searchParams?.get('error') || '');
  const [isLoading, setIsLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const supabase = createSupabaseBrowserClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      // Прямая аутентификация через Supabase
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Ошибка аутентификации:', error);
        setError(error.message || 'Ошибка при входе');
        setIsLoading(false);
        return;
      }

      // При успешной аутентификации перенаправляем на админ панель
      router.push('/admin');
      router.refresh(); // Обновляем состояние роутера
    } catch (err) {
      console.error('Ошибка при входе:', err);
      setError('Произошла ошибка при попытке входа');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Вход в админ-панель
          </h2>
        </div>
        <form className="mt-8 space-y-6"
              ref={formRef}
              onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{decodeURIComponent(error)}</div>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={isLoading}
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                  isLoading ? 'bg-gray-100' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="Email"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Пароль
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={isLoading}
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                  isLoading ? 'bg-gray-100' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="Пароль"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}