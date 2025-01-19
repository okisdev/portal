import type { Metadata } from 'next';
import '@/styles/globals.css';
import { geistSans } from '@/app/font';
import RootProvider from '@/app/provider';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';
import { ThemeProvider } from 'next-themes';

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
          <ThemeProvider attribute='class' defaultTheme='system' value={{ light: 'light', dark: 'dark' }} disableTransitionOnChange>
            {children}

            <Toaster richColors />
          </ThemeProvider>
        </body>
      </html>
    </RootProvider>
  );
}
