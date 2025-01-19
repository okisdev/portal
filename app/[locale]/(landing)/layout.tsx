import Footer from '@/components/landing/footer';
import Header from '@/components/landing/header';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Portal',
  description: 'Streamline Your Business Operations',
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className='flex min-h-screen flex-col'>
      <Header />

      {children}

      <Footer />
    </main>
  );
}
