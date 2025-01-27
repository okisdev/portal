'use client';

import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, generateUUID } from '@/lib/utils';
import { api } from '@/utils/trpc/client';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Mail, MessageSquare } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

export default function NotificationsPage() {
  const t = useTranslations();

  const [filterType, setFilterType] = useState('all');

  const utils = api.useUtils();

  const { data: notifications, isLoading } = api.user.getNotifications.useQuery();

  const markAsRead = api.user.markNotificationAsRead.useMutation({
    onSuccess: () => {
      utils.user.getNotifications.invalidate();
      toast.success('Notification marked as read');
    },
    onError: () => {
      toast.error('Failed to mark notification as read');
    },
  });

  const markAllAsRead = api.user.markAllNotificationsAsRead.useMutation({
    onSuccess: () => {
      utils.user.getNotifications.invalidate();
      toast.success('All notifications marked as read');
    },
    onError: () => {
      toast.error('Failed to mark all notifications as read');
    },
  });

  const filteredNotifications = notifications?.filter((notification) => {
    if (filterType === 'all') return true;
    if (filterType === 'unread') return !notification.read;
    return notification.type === filterType;
  });

  return (
    <div className='space-y-6 p-6'>
      <PageHeader title={t('notifications')} description={t('notifications_description')} />

      <div className='flex flex-col gap-8'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder={t('filter_type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>{t('all_notifications')}</SelectItem>
                <SelectItem value='unread'>{t('unread')}</SelectItem>
                <SelectItem value='message'>{t('messages')}</SelectItem>
                <SelectItem value='email'>{t('emails')}</SelectItem>
                <SelectItem value='system'>{t('system')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant='outline' size='sm' onClick={() => markAllAsRead.mutate()} className='transition-colors hover:bg-neutral-100'>
            {markAllAsRead.isPending ? t('marking_all_as_read') : t('mark_all_as_read')}
          </Button>
        </div>

        <div className='space-y-3'>
          {isLoading &&
            Array(3)
              .fill(0)
              .map((_, i) => (
                <div key={generateUUID()} className='flex animate-pulse flex-col gap-2 rounded-lg border bg-white p-4 shadow-sm'>
                  <div className='flex items-center gap-3'>
                    <Skeleton className='h-8 w-8 rounded-full' />
                    <div className='flex-1 space-y-2'>
                      <Skeleton className='h-4 w-1/4 rounded' />
                      <Skeleton className='h-4 w-3/4 rounded' />
                    </div>
                  </div>
                </div>
              ))}

          {filteredNotifications?.length === 0 && !isLoading && (
            <div className='flex flex-col items-center justify-center rounded-lg border bg-white p-8 text-center'>
              <Bell className='mb-4 h-12 w-12 text-neutral-300' />
              <p className='text-neutral-500'>{t('no_notifications_found')}</p>
            </div>
          )}

          {filteredNotifications?.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                'group flex items-start gap-4 rounded-lg border p-4 shadow-sm transition-all duration-200 hover:bg-neutral-50',
                notification.read ? 'bg-white' : 'bg-blue-50 hover:bg-blue-100/80'
              )}
            >
              <div className='rounded-full bg-neutral-100/80 p-2'>
                <NotificationIcon type={notification.type} />
              </div>
              <div className='min-w-0 flex-1'>
                <div className='flex items-start justify-between gap-4'>
                  <p className={`font-medium ${notification.read ? 'text-neutral-700' : 'text-neutral-900'}`}>{notification.title}</p>
                  <time className='whitespace-nowrap text-neutral-500 text-sm'>
                    {notification.createdAt &&
                      formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                      })}
                  </time>
                </div>
                <p className={`mt-1 text-sm ${notification.read ? 'text-neutral-500' : 'text-neutral-600'}`}>{notification.message}</p>
              </div>
              <div className='flex flex-row items-center gap-2'>
                {notification.metadata && (
                  <Button variant='ghost' size='sm'>
                    <Link href={`/dashboard/contacts/${JSON.parse(notification.metadata)?.contactId}`}>{t('view')}</Link>
                  </Button>
                )}
                {!notification.read && (
                  <Button variant='ghost' size='sm' className='shrink-0 opacity-0 transition-opacity hover:bg-blue-100 group-hover:opacity-100' onClick={() => markAsRead.mutate(notification.id)}>
                    {t('mark_as_read')}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NotificationIcon({ type }: { type: string }) {
  switch (type) {
    case 'message':
      return <MessageSquare className='h-5 w-5 text-blue-500' />;
    case 'email':
      return <Mail className='h-5 w-5 text-green-500' />;
    default:
      return <Bell className='h-5 w-5 text-neutral-500' />;
  }
}
