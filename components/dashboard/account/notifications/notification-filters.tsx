'use client';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/utils/trpc/client';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

export function NotificationFilters() {
  const t = useTranslations();

  const utils = api.useUtils();

  const markAllAsRead = api.account.markAllNotificationsAsRead.useMutation({
    onSuccess: () => {
      utils.account.getNotifications.invalidate();
      toast.success('All notifications marked as read');
    },
    onError: () => {
      toast.error('Failed to mark all notifications as read');
    },
  });

  return (
    <div className='flex items-center justify-between'>
      <div className='flex items-center gap-4'>
        <Select defaultValue='all'>
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='Filter by type' />
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
      <Button variant='outline' size='sm' onClick={() => markAllAsRead.mutate()}>
        {markAllAsRead.isPending ? t('marking_all_as_read') : t('mark_all_as_read')}
      </Button>
    </div>
  );
}
