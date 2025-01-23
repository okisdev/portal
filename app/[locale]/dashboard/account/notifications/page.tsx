import { NotificationFilters } from '@/components/dashboard/account/notifications/notification-filters';
import { NotificationList } from '@/components/dashboard/account/notifications/notification-list';
import { PageHeader } from '@/components/shared/page-header';
import { useTranslations } from 'next-intl';
import { Suspense } from 'react';

export const metadata = {
  title: 'Notifications',
  description: 'Manage your notification preferences and view your notifications',
};

export default function NotificationsPage() {
  const t = useTranslations();

  return (
    <div className='space-y-4 p-4'>
      <PageHeader title={t('notifications')} description={t('notifications_description')} />

      <div className='flex flex-col gap-8'>
        <NotificationFilters />

        <Suspense fallback={<NotificationsSkeleton />}>
          <NotificationList />
        </Suspense>
      </div>
    </div>
  );
}

function NotificationsSkeleton() {
  return (
    <div className='space-y-4'>
      {Array.from({ length: 5 }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
        <div key={i} className='flex animate-pulse items-center gap-4 rounded-lg border p-4'>
          <div className='h-12 w-12 rounded-full bg-neutral-200' />
          <div className='flex-1 space-y-2'>
            <div className='h-4 w-1/4 rounded bg-neutral-200' />
            <div className='h-4 w-3/4 rounded bg-neutral-200' />
          </div>
        </div>
      ))}
    </div>
  );
}
