import type { Metadata } from 'next';
import '@/styles/globals.css';
import { geistMono, geistSans } from '@/app/font';
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
    <html lang='en'>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}

        <Toaster />
      </body>
    </html>
  );
}
