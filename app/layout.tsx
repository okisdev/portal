import type { Metadata } from 'next';
import '@/styles/globals.css';
import { geistSans } from '@/app/font';
import RootProvider from '@/app/provider';
import { Toaster } from '@/components/ui/sonner';

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
        <body className={`${geistSans.className} antialiased`}>
          {children}

          <Toaster />
        </body>
      </html>
    </RootProvider>
  );
}
