import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Footer from '@/components/landing/footer';
import Header from '@/components/landing/header';
import { auth } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Portal',
  description: 'Streamline Your Business Operations',
};

export default async function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect('/dashboard');
  }

  return (
    <main className='flex min-h-screen flex-col'>
      <Header />

      {children}

      <Footer />
    </main>
  );
}
