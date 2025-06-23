import { ArrowLeft, Sparkle } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/auth';

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (session) return redirect('/dashboard');

  const t = await getTranslations();

  return (
    <div className='flex min-h-screen items-center justify-center bg-background'>
      <Link
        href='/'
        className='absolute top-5 left-5 flex items-center text-muted-foreground hover:text-foreground md:top-10 md:left-10'
      >
        <ArrowLeft className='mr-1 h-5 w-5' />
        {t('back')}
      </Link>
      <div className='w-full max-w-md space-y-6 p-8'>
        <div className='flex items-center justify-center'>
          <Sparkle className='h-12 w-12' />
        </div>
        {children}
      </div>
    </div>
  );
}
