'use client';

import { ReactNode } from 'react';
import LayoutWrapper from '@/components/LayoutWrapper';

export default function ClientLayoutWrapper({ children }: { children: ReactNode }) {
  return <LayoutWrapper>{children}</LayoutWrapper>;
}