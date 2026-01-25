import { Metadata } from 'next';
import PublicPage from '@/components/PublicPage';

export const metadata: Metadata = {
  title: 'Контакты',
  description: 'Контактная информация нашей компании',
};

export default function ContactsPage() {
  return (
    <PublicPage slug="contacts" />
  );
}