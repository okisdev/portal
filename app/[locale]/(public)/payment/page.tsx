'use client';

import { PageLoading } from '@/components/shared/page-loading';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const PaymentContent = () => {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');

  if (mode === 'success') {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='space-y-4 p-8 text-center'>
          <div className='flex justify-center'>
            <CheckCircle2 className='h-16 w-16 text-green-500' />
          </div>
          <h1 className='font-bold text-2xl'>Payment Successful!</h1>
          <p className='text-neutral-600'>Thank you for your payment. Your subscription has been activated.</p>
          {/* <Button asChild>
            <Link href='/dashboard'>Go to Dashboard</Link>
          </Button> */}
        </div>
      </div>
    );
  }

  if (mode === 'cancel') {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='space-y-4 p-8 text-center'>
          <div className='flex justify-center'>
            <XCircle className='h-16 w-16 text-red-500' />
          </div>
          <h1 className='font-bold text-2xl'>Payment Cancelled</h1>
          <p className='text-neutral-600'>Your payment was cancelled. No charges were made.</p>
          {/* <Button asChild>
            <Link href='/'>Return Home</Link>
          </Button> */}
        </div>
      </div>
    );
  }

  // If no mode or invalid mode, redirect to home
  return (
    <div className='flex min-h-screen items-center justify-center'>
      <div className='space-y-4 p-8 text-center'>
        <h1 className='font-bold text-2xl'>Invalid Payment Status</h1>
        <Button asChild>
          <Link href='/'>Return Home</Link>
        </Button>
      </div>
    </div>
  );
};

export default function PaymentPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <PaymentContent />
    </Suspense>
  );
}
