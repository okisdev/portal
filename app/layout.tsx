import type { ReactNode } from 'react';
import '@/styles/globals.css';
import type { Metadata } from 'next';
import RootProvider from '@/app/provider';

export const metadata: Metadata = {
  title: 'Portal',
  description: 'Streamline Your Business Operations',
};

interface Props {
  children: ReactNode;
}

export default function RootLayout({ children }: Props) {
  return <RootProvider>{children}</RootProvider>;
}
