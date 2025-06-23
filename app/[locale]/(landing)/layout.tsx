import { auth } from '@/auth';
import Footer from '@/components/landing/footer';
import Header from '@/components/landing/header';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Portal',
  description: 'Streamline Your Business Operations',
};

export default async function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (session) redirect('/dashboard');

  return (
    <main className='flex min-h-screen flex-col'>
      <Header />

      {children}

      <Footer />
    </main>
  );
}
