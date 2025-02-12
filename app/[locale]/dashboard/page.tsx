'use client';

import { PageHeader } from '@/components/shared/page-header';
import { PageLoading } from '@/components/shared/page-loading';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';

export default function Dashboard() {
  const t = useTranslations();

  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <PageLoading />;
  }

  return (
    <div className='space-y-4 p-4'>
      <PageHeader title={t('welcome_back', { name: session?.user?.name })} description={t('welcome_description')} />
    </div>
  );
}
