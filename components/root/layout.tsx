import BodyProvider from '@/components/root/provider';
import { cn } from '@/lib/utils';
import { geistSans } from '@/styles/font';
import { ReactScan } from '@/utils/react-scan';
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
        <meta name='apple-mobile-web-app-title' content='Portal' />
        <meta name='theme-color' media='(prefers-color-scheme: light)' content='white' />
        <meta name='theme-color' media='(prefers-color-scheme: dark)' content='black' />
        <Script defer src='https://umami.harisfox.com/script.js' data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID} />
      </head>

      <ReactScan />

      <body className={cn(geistSans.className, 'antialiased')}>
        <NextIntlClientProvider messages={messages}>
          <BodyProvider>{children}</BodyProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
