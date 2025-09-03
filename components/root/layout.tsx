import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import BodyProvider from '@/components/root/provider';
import { cn } from '@/lib/utils';
import { geistSans } from '@/styles/font';
import { ReactScan } from '@/utils/react-scan';

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
        <meta content='Portal' name='apple-mobile-web-app-title' />
        <meta
          content='white'
          media='(prefers-color-scheme: light)'
          name='theme-color'
        />
        <meta
          content='black'
          media='(prefers-color-scheme: dark)'
          name='theme-color'
        />
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
