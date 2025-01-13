import type { Metadata } from 'next';
import '@/styles/globals.css';
import { geistSans } from '@/app/font';
import RootProvider from '@/app/provider';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'CRM',
  description: 'CRM',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RootProvider>
      <html lang='en'>
        <body className={cn(geistSans.className, 'antialiased')}>
          {children}

          <Toaster richColors />
        </body>
      </html>
    </RootProvider>
  );
}
