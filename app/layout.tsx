import type { Metadata } from 'next';
import '@/styles/globals.css';
import font from '@/app/font';

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
      <body className={`${font.geistSans.variable} ${font.geistMono.variable} antialiased`}>{children}</body>
    </html>
  );
}
