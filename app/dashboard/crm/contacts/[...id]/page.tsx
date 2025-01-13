'use client';

import { CompanyCombobox } from '@/components/shared/company-combobox';
import { PhoneInput } from '@/components/shared/phone-input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDate, isDev } from '@/lib/utils';
import { api } from '@/utils/trpc/client';
import { Edit2, Mail, MoreHorizontal, Phone, Printer, Send } from 'lucide-react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { useState } from 'react';

export default function ContactIdPage() {
  const { id: contactId } = useParams<{ id: string }>();

  const isDevMode = isDev();

  const utils = api.useUtils();

  const { data: contact, isLoading } = api.dashboard.getContactById.useQuery({
    id: contactId[0],
  });
  const { data: activities, refetch: refetchActivities } = api.dashboard.getContactActivities.useQuery({
    id: contactId[0],
  });
  const { data: payments, isLoading: isPaymentsLoading } = api.dashboard.getContactPayments.useQuery({ email: contact?.email || '' }, { enabled: !!contact?.email });

  const [newActivity, setNewActivity] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
  });

  const addActivity = api.dashboard.addContactActivity.useMutation({
    onSuccess: () => {
      setNewActivity('');
      refetchActivities();
    },
  });

  const updateContact = api.dashboard.updateContact.useMutation({
    onSuccess: () => {
      setIsEditModalOpen(false);
      utils.dashboard.getContactById.invalidate({ id: contactId[0] });
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isLoading && !contact) {
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

  const handleEditClick = () => {
    setEditForm({
      name: contact?.name || '',
      email: contact?.email || '',
      phone: contact?.phone || '',
      company: contact?.company || '',
    });
    setIsEditModalOpen(true);
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    updateContact.mutate({
      id: contactId[0],
      ...editForm,
    });
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between border-b pb-4'>
        <div className='flex items-center space-x-4'>
          <div className='size-12 rounded-full bg-gray-200' />
          <div>
            <h1 className='font-semibold text-xl'>{contact?.name}</h1>
            <p className='text-gray-500 text-sm'>{contact?.company || 'Unknown'}</p>
            <p className='text-gray-500 text-sm'>{contact?.email}</p>
          </div>
        </div>
        <div className='flex space-x-2'>
          <Button variant='ghost' size='icon' onClick={handleEditClick}>
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

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Contact Information</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='name'>Name</Label>
              <Input id='name' value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input id='email' type='email' value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='phone'>Phone</Label>
              <PhoneInput id='phone' value={editForm.phone} onChange={(value) => setEditForm({ ...editForm, phone: value })} />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='company'>Company</Label>
              <CompanyCombobox value={editForm.company} onChange={(value) => setEditForm({ ...editForm, company: value })} />
            </div>
            <div className='flex justify-end space-x-2'>
              <Button type='button' variant='outline' onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type='submit' disabled={updateContact.isPending}>
                {updateContact.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className='grid grid-cols-3 gap-6'>
        <div className='col-span-2 space-y-6'>
          <div className='rounded-lg border p-4'>
            <h2 className='mb-4 font-semibold text-lg'>日期焦點</h2>
            <div className='grid grid-cols-3 gap-4'>
              <div>
                <p className='text-gray-500 text-sm'>建立日期</p>
                <p>{formatDate(new Date(contact?.createdAt || ''))}</p>
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
            <p className='text-gray-500 text-sm'>{contact?.company || 'Unknown'}</p>
            <p className='text-gray-500 text-sm'>電話：{contact?.phone || '—'}</p>
          </div>

          <div className='rounded-lg border p-4'>
            <div className='mb-2 flex items-center justify-between'>
              <h2 className='font-semibold text-lg'>Payments</h2>
              <Button variant='outline' size='sm' asChild className='h-8'>
                <Link
                  href={isDevMode ? `https://dashboard.stripe.com/test/search?query=${contact?.email}` : `https://dashboard.stripe.com/search?query=${contact?.email}`}
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  View in Stripe
                </Link>
              </Button>
            </div>

            {payments && payments.length > 0 ? (
              <div className='space-y-3'>
                {payments.map((payment) => (
                  <div key={payment.id} className='border-b pb-2'>
                    <div className='flex items-center justify-between'>
                      <span className='font-medium'>
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: payment.currency,
                        }).format(payment.amount)}
                      </span>
                      <span className={`text-sm capitalize ${payment.status === 'succeeded' ? 'text-green-600' : payment.status === 'processing' ? 'text-yellow-600' : 'text-red-600'}`}>
                        {payment.status}
                      </span>
                    </div>
                    <p className='text-gray-500 text-sm'>{formatDate(new Date(payment.created * 1000))}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className='py-2 text-gray-500 text-sm'>No payments found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
