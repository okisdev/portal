import BodyProvider from '@/components/root/provider';
import { cn } from '@/lib/utils';
import { geistSans } from '@/styles/font';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import Script from 'next/script';

type Props = Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>;

export default async function RootLayout(props: Props) {
  const { params, children } = props;

  const { locale } = params;

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* <Script src='https://unpkg.com/react-scan/dist/auto.global.js' async /> */}
        <Script src='https://unpkg.com/react-scan/dist/install-hook.global.js' strategy='beforeInteractive' />
      </head>
      <body className={cn(geistSans.className, 'antialiased')}>
        <NextIntlClientProvider messages={messages}>
          <BodyProvider>{children}</BodyProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
