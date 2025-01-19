import type { Metadata } from 'next';
import '@/styles/globals.css';
import BodyProvider from '@/app/body-provider';
import RootProvider from '@/app/provider';
import { cn } from '@/lib/utils';
import { geistSans } from '@/styles/font';

export const metadata: Metadata = {
  title: 'Portal',
  description: 'Portal',
};

type Props = Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>;

export default async function RootLayout(props: Props) {
  const { params, children } = props;

  const { locale } = await params;

  return (
    <RootProvider>
      <html lang={locale} suppressHydrationWarning>
        <body className={cn(geistSans.className, 'antialiased')}>
          <BodyProvider>{children}</BodyProvider>
        </body>
      </html>
    </RootProvider>
  );
}
