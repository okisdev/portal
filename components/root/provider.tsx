'use client';

import { Toaster } from '@/components/ui/sonner';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';
import { ThemeProvider } from 'next-themes';
import { Monitoring } from 'react-scan/monitoring/next';

export default function BodyProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider
      attribute='class'
      defaultTheme='system'
      value={{ light: 'light', dark: 'dark' }}
      disableTransitionOnChange
    >
      {children}

      <Toaster richColors position='top-right' />

      <ProgressBar
        height='2px'
        color='hsl(var(--foreground))'
        options={{ showSpinner: false }}
        shallowRouting
      />

      <Monitoring
        url='https://monitoring.react-scan.com/api/v1/ingest'
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        apiKey={process.env.NEXT_PUBLIC_REACT_SCAN_API_KEY!}
        commit={process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA}
        branch={process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF}
      />

      <SpeedInsights />

      <Analytics />
    </ThemeProvider>
  );
}
