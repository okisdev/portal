import RootLayout from '@/components/root/layout';
import { routing } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

export const generateMetadata = async () => {
  const t = await getTranslations();

  return {
    title: '404 - Portal',
    description: t('404_description'),
  };
};

export default async function NotFound() {
  const t = await getTranslations();

  return (
    <RootLayout params={{ locale: routing.defaultLocale }}>
      <main className='flex min-h-screen flex-1 flex-col items-center justify-center gap-4 p-8'>
        <div className='space-y-2 text-center'>
          <h1 className='font-medium text-xl'>{t('404_title')}</h1>
          <p className='text-muted-foreground'>{t('404_description')}</p>
        </div>
        <Link
          href='/'
          className='text-muted-foreground text-sm transition duration-300 hover:text-primary'
        >
          {t('go_back_to_home')}
        </Link>
      </main>
    </RootLayout>
  );
}
