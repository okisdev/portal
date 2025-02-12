import LocaleProvider from '@/app/[locale]/provider';
import RootLayout from '@/components/root/layout';
import { routing } from '@/i18n/routing';
import type { Locale } from '@/types/i18n';
import { notFound } from 'next/navigation';

type Props = Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>;

export default async function LocaleLayout(props: Props) {
  const { params, children } = props;

  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) notFound();

  return (
    <RootLayout params={{ locale }}>
      <LocaleProvider>{children}</LocaleProvider>
    </RootLayout>
  );
}
