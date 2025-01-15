'use client';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/utils/trpc/client';
import { toast } from 'sonner';

export function NotificationFilters() {
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
            <SelectItem value='all'>All notifications</SelectItem>
            <SelectItem value='unread'>Unread</SelectItem>
            <SelectItem value='message'>Messages</SelectItem>
            <SelectItem value='email'>Emails</SelectItem>
            <SelectItem value='system'>System</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button variant='outline' size='sm' onClick={() => markAllAsRead.mutate()}>
        Mark all as read
      </Button>
    </div>
  );
}
