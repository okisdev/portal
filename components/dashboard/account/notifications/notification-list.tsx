'use client';

import { Button } from '@/components/ui/button';
import { api } from '@/utils/trpc/client';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Mail, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export function NotificationList() {
  const utils = api.useUtils();

  const { data: notifications } = api.account.getNotifications.useQuery();

  const markAsRead = api.account.markNotificationAsRead.useMutation({
    onSuccess: () => {
      utils.account.getNotifications.invalidate();
      toast.success('Notification marked as read');
    },
    onError: () => {
      toast.error('Failed to mark notification as read');
    },
  });

  return (
    <div className='space-y-4'>
      {notifications?.map((notification) => (
        <div key={notification.id} className={`flex items-start gap-4 rounded-lg border p-4 ${notification.read ? 'bg-white' : 'bg-blue-50'}`}>
          <NotificationIcon type={notification.type} />
          <div className='flex-1'>
            <div className='flex items-center justify-between'>
              <p className='font-medium'>{notification.title}</p>
              <time className='text-neutral-500 text-sm'>
                {notification.createdAt &&
                  formatDistanceToNow(new Date(notification.createdAt), {
                    addSuffix: true,
                  })}
              </time>
            </div>
            <p className='mt-1 text-gray-600'>{notification.message}</p>
          </div>
          {!notification.read && (
            <Button variant='ghost' size='sm' className='shrink-0' onClick={() => markAsRead.mutate(notification.id)}>
              Mark as read
            </Button>
          )}
        </div>
      ))}
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
