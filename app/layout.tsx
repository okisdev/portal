import type { Metadata } from 'next';
import '@/styles/globals.css';
import BodyProvider from '@/app/body-provider';
import { geistSans } from '@/app/font';
import RootProvider from '@/app/provider';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Portal',
  description: 'Portal',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RootProvider>
      <html lang='en' suppressHydrationWarning>
        <body className={cn(geistSans.className, 'antialiased')}>
          <BodyProvider>{children}</BodyProvider>
        </body>
      </html>
    </RootProvider>
  );
}
