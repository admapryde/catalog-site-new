import { Metadata } from 'next';
import PublicPage from '@/components/PublicPage';

export const metadata: Metadata = {
  title: 'О нас',
  description: 'Информация о нашей компании',
};

export default function AboutPage() {
  return (
    <PublicPage slug="about" />
  );
}