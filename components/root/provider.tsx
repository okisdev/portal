'use client';

import { Toaster } from '@/components/ui/sonner';
import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';
import { ThemeProvider } from 'next-themes';
import { Monitoring } from 'react-scan/monitoring/next';

export default function BodyProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider attribute='class' defaultTheme='system' value={{ light: 'light', dark: 'dark' }} disableTransitionOnChange>
      {children}

      <Toaster richColors />

      <ProgressBar height='2px' color='hsl(var(--foreground))' options={{ showSpinner: false }} shallowRouting />

      <Monitoring
        apiKey='--MU9ty2MGH89Zw9QvNvP-VVc41VepvG'
        url='https://monitoring.react-scan.com/api/v1/ingest'
        commit={process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA}
        branch={process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF}
      />
    </ThemeProvider>
  );
}
