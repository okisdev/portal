'use client';

import { PageHeader } from '@/components/shared/page-header';
import { useSession } from 'next-auth/react';

export default function Dashboard() {
  const { data: session } = useSession();

  return (
    <div className='space-y-4 p-4'>
      <PageHeader title={`Welcome back, ${session?.user?.name}`} description='Welcome to your dashboard' />
    </div>
  );
}
