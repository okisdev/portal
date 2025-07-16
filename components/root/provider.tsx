'use client';

import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';
import { ThemeProvider } from 'next-themes';
import { Monitoring } from 'react-scan/monitoring/next';
import { Toaster } from '@/components/ui/sonner';

export default function BodyProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider
      attribute='class'
      defaultTheme='system'
      disableTransitionOnChange
      value={{ light: 'light', dark: 'dark' }}
    >
      {children}

      <Toaster position='top-right' richColors />

      <ProgressBar
        color='hsl(var(--foreground))'
        height='2px'
        options={{ showSpinner: false }}
        shallowRouting
      />

      <Monitoring
        apiKey={process.env.NEXT_PUBLIC_REACT_SCAN_API_KEY!}
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        branch={process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF}
        commit={process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA}
        url='https://monitoring.react-scan.com/api/v1/ingest'
      />

      <SpeedInsights />

      <Analytics />
    </ThemeProvider>
  );
}
