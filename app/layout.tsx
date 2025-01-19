import type { ReactNode } from 'react';
import '@/styles/globals.css';
import RootProvider from '@/app/provider';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Portal',
  description: 'Streamline Your Business Operations',
};

type Props = {
  children: ReactNode;
};

export default function RootLayout({ children }: Props) {
  return <RootProvider>{children}</RootProvider>;
}
