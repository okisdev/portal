'use client';

import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { api } from '@/utils/trpc/client';
import { Edit2, Mail, MoreHorizontal, Phone, Printer, Send } from 'lucide-react';
import { notFound, useParams } from 'next/navigation';
import { useState } from 'react';

export default function ContactIdPage() {
  const { id: contactId } = useParams<{ id: string }>();
  const [newActivity, setNewActivity] = useState('');

  const { data: contacts } = api.dashboard.getContacts.useQuery();
  const { data: activities, refetch: refetchActivities } = api.dashboard.getContactActivities.useQuery({
    id: contactId[0],
  });

  const addActivity = api.dashboard.addContactActivity.useMutation({
    onSuccess: () => {
      setNewActivity('');
      refetchActivities();
    },
  });

  const contact = contacts?.find((contact) => contact.id === contactId[0]);

  if (!contact) {
    notFound();
  }

  const handleSubmitActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivity.trim()) return;

    addActivity.mutate({
      contactId: contactId[0],
      type: 'note',
      title: 'Quick Note',
      description: newActivity,
    });
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between border-b pb-4'>
        <div className='flex items-center space-x-4'>
          <div className='size-12 rounded-full bg-gray-200' />
          <div>
            <h1 className='font-semibold text-xl'>{contact.name}</h1>
            <p className='text-gray-500 text-sm'>{contact.company || 'Unknown'}</p>
            <p className='text-gray-500 text-sm'>{contact.email}</p>
          </div>
        </div>
        <div className='flex space-x-2'>
          <Button variant='ghost' size='icon'>
            <Edit2 className='size-4' />
          </Button>
          <Button variant='ghost' size='icon'>
            <Mail className='size-4' />
          </Button>
          <Button variant='ghost' size='icon'>
            <Phone className='size-4' />
          </Button>
          <Button variant='ghost' size='icon'>
            <Printer className='size-4' />
          </Button>
          <Button variant='ghost' size='icon'>
            <MoreHorizontal className='size-4' />
          </Button>
        </div>
      </div>

      <div className='grid grid-cols-3 gap-6'>
        <div className='col-span-2 space-y-6'>
          <div className='rounded-lg border p-4'>
            <h2 className='mb-4 font-semibold text-lg'>日期焦點</h2>
            <div className='grid grid-cols-3 gap-4'>
              <div>
                <p className='text-gray-500 text-sm'>建立日期</p>
                <p>{formatDate(new Date(contact.createdAt))}</p>
              </div>
              <div>
                <p className='text-gray-500 text-sm'>生命週期階段</p>
                <p>Lead</p>
              </div>
              <div>
                <p className='text-gray-500 text-sm'>上次活動日期</p>
                <p>—</p>
              </div>
            </div>
          </div>

          <div className='h-96 rounded-lg border p-4'>
            <div className='mb-4 flex items-center justify-between'>
              <h2 className='font-semibold text-lg'>近期活動（速記）</h2>
              <Button variant='outline' size='sm'>
                {activities?.length || 0} 個活動
              </Button>
            </div>

            <form onSubmit={handleSubmitActivity} className='mb-4'>
              <div className='flex gap-2'>
                <input
                  type='text'
                  value={newActivity}
                  onChange={(e) => setNewActivity(e.target.value)}
                  placeholder='快速記錄活動...'
                  className='h-8 flex-1 rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
                <Button type='submit' size='sm' disabled={addActivity.isPending}>
                  <Send className='mr-2 size-4' />
                  送出
                </Button>
              </div>
            </form>

            {activities && activities.length > 0 ? (
              <div className='space-y-4'>
                {activities.map((activity) => (
                  <div key={activity.id} className='border-b pb-3'>
                    <div className='flex items-start justify-between'>
                      <div>
                        <p className='font-medium'>{activity.title}</p>
                        <p className='text-gray-600 text-sm'>{activity.description}</p>
                      </div>
                      <span className='text-gray-500 text-sm'>{formatDate(new Date(activity.createdAt))}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='flex items-center justify-center py-8 text-gray-500'>
                <p>沒有符合目前篩選條件的活動。</p>
              </div>
            )}
          </div>
        </div>

        <div className='space-y-6'>
          <div className='rounded-lg border p-4'>
            <h2 className='mb-2 font-semibold text-lg'>公司</h2>
            <p className='text-gray-500 text-sm'>{contact.company || 'Unknown'}</p>
            <p className='text-gray-500 text-sm'>電話：{contact.phone || '—'}</p>
          </div>

          <div className='rounded-lg border p-4'>
            <div className='mb-2 flex items-center justify-between'>
              <h2 className='font-semibold text-lg'>Payments</h2>
              <Button variant='outline' size='sm'>
                新增
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
