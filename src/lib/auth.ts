import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // Здесь должна быть ваша логика аутентификации
        // В демонстрационных целях просто возвращаем объект пользователя
        // В реальном приложении здесь должна быть проверка с базой данных
        if (credentials?.username && credentials?.password) {
          // Простая проверка для демонстрации
          if (credentials.username === 'admin' && credentials.password === 'password') {
            return {
              id: '1',
              name: 'admin',
              email: 'admin@example.com'
            };
          }
        }
        return null;
      }
    })
  ],
  secret: process.env.AUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
      }
      return session;
    },
    async authorized({ auth, request: { nextUrl } }) {
      // Проверяем, авторизован ли пользователь при доступе к админке
      const isLoggedIn = !!auth?.user;
      const isOnAdmin = nextUrl.pathname.startsWith('/admin');
      
      if (isOnAdmin) {
        if (isLoggedIn) return true;
        return false; // Перенаправит на страницу входа
      }
      
      return true;
    }
  },
  pages: {
    signIn: '/login',
  }
});

export { handler as GET, handler as POST };