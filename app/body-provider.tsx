'use client';

import { Toaster } from '@/components/ui/sonner';
import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';
import { ThemeProvider } from 'next-themes';

export default function BodyProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider attribute='class' defaultTheme='system' value={{ light: 'light', dark: 'dark' }} disableTransitionOnChange>
      {children}

      <Toaster richColors />

      <ProgressBar height='2px' color='#000' options={{ showSpinner: false }} shallowRouting />
    </ThemeProvider>
  );
}
