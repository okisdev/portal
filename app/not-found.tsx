import RootLayout from '@/components/root/layout';
import { routing } from '@/i18n/routing';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '404 Not Found - Portal',
  description: 'The page you are looking for does not exist.',
};

export default function NotFound() {
  return (
    <RootLayout params={{ locale: routing.defaultLocale }}>
      <main className='flex min-h-screen flex-1 flex-col items-center justify-center gap-4 p-8'>
        <div className='space-y-2 text-center'>
          <h1 className='font-medium text-xl'>404 - Not Found</h1>
          <p className='text-muted-foreground'>The page you are looking for does not exist.</p>
        </div>
        <Link href='/' className='text-muted-foreground text-sm transition duration-300 hover:text-primary'>
          Go back to home
        </Link>
      </main>
    </RootLayout>
  );
}
