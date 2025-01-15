'use client';

import { ColorBadge } from '@/components/shared/color-badge';
import { Combobox } from '@/components/shared/combobox';
import { PhoneInput } from '@/components/shared/phone-input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { insuranceCompanies, sources } from '@/data/data';
import type { Priority, Status } from '@/lib/schema';
import { cn, formatDate, isDev } from '@/lib/utils';
import { api } from '@/utils/trpc/client';
import { Edit2, Mail, MoreHorizontal, Phone, Printer, Send } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { useState } from 'react';

export default function ContactIdPage() {
  const { id: contactId } = useParams<{ id: string }>();

  const { data: session } = useSession();

  const isDevMode = isDev();

  const utils = api.useUtils();

  const { data: contact, isLoading } = api.dashboard.getContactById.useQuery({
    id: contactId[0],
  });
  const { data: activities, refetch: refetchActivities } = api.dashboard.getContactActivities.useQuery({
    id: contactId[0],
  });
  const { data: payments } = api.pay.getPaymentByContactEmail.useQuery({ email: contact?.email || '' }, { enabled: !!contact?.email });

  const [newActivity, setNewActivity] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    status: 'lead' as Status,
    source: '',
    priority: 'medium' as Priority,
  });

  const createContactActivity = api.dashboard.createContactActivity.useMutation({
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

  const getInitiatorLabel = (activity: { initiatorType: string; type: string; initiatorId: string | null }) => {
    if (activity.initiatorType === 'contact') {
      return 'Contact';
    }
    if (activity.initiatorType === 'system') {
      return 'System';
    }
    return activity.initiatorId || 'Unknown User';
  };

  const handleSubmitActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivity.trim()) return;

    createContactActivity.mutate({
      contactId: contactId[0],
      type: 'note',
      initiatorType: 'user',
      initiatorId: session?.user.id || '',
      title: 'Quick Note',
      description: newActivity,
    });
  };

  const handleEditClick = () => {
    const [firstName = '', lastName = ''] = contact?.name?.split(' ') || ['', ''];
    setEditForm({
      firstName,
      lastName,
      email: contact?.email || '',
      phone: contact?.phone || '',
      company: contact?.company || '',
      status: contact?.status || 'lead',
      source: contact?.source || '',
      priority: contact?.priority || 'low',
    });
    setIsEditModalOpen(true);
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    updateContact.mutate({
      id: contactId[0],
      firstName: editForm.firstName,
      lastName: editForm.lastName,
      email: editForm.email,
      phone: editForm.phone,
      company: editForm.company,
      status: editForm.status,
      source: editForm.source,
      priority: editForm.priority,
    });
  };

  const handleStatusChange = (value: Status) => {
    updateContact.mutate({
      id: contactId[0],
      status: value,
      firstName: contact?.firstName || '',
      lastName: contact?.lastName || '',
      email: contact?.email || '',
      phone: contact?.phone || '',
      company: contact?.company || '',
      source: contact?.source || '',
      priority: contact?.priority || 'medium',
    });
  };

  const handlePriorityChange = (value: Priority) => {
    updateContact.mutate({
      id: contactId[0],
      priority: value,
      firstName: contact?.firstName || '',
      lastName: contact?.lastName || '',
      email: contact?.email || '',
      phone: contact?.phone || '',
      company: contact?.company || '',
      source: contact?.source || '',
      status: contact?.status || 'lead',
    });
  };

  return (
    <div className='space-y-6 p-6'>
      <div className='flex items-center justify-between border-b pb-4'>
        <div className='flex items-center space-x-4'>
          <Avatar className='size-12'>
            <AvatarImage src='' />
            <AvatarFallback>{contact?.name?.charAt(0) || ''}</AvatarFallback>
          </Avatar>
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
          <Button variant='ghost' size='icon' asChild>
            <Link href={`mailto:${contact?.email}`} target='_blank' rel='noopener noreferrer'>
              <Mail className='size-4' />
            </Link>
          </Button>
          <Button variant='ghost' size='icon' asChild>
            <Link
              href={!contact?.phone ? '' : `https://wa.me/${contact?.phone?.replace(/\D/g, '')}`}
              target={'_blank'}
              rel='noopener noreferrer'
              className={cn(!contact?.phone && 'cursor-not-allowed opacity-50')}
            >
              <Phone className='size-4' />
            </Link>
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
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='firstName'>First Name</Label>
                <Input id='firstName' value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='lastName'>Last Name</Label>
                <Input id='lastName' value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} />
              </div>
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
              <Combobox
                value={editForm.company}
                onChange={(value) => setEditForm({ ...editForm, company: value })}
                items={insuranceCompanies}
                placeholder='Select company...'
                searchPlaceholder='Search company...'
                groupHeading='Companies'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='status'>Status</Label>

              <Select value={editForm.status} onValueChange={(value) => setEditForm({ ...editForm, status: value as Status })}>
                <SelectTrigger>
                  <SelectValue placeholder='Select status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='lead'>Lead</SelectItem>
                  <SelectItem value='prospect'>Prospect</SelectItem>
                  <SelectItem value='customer'>Customer</SelectItem>
                  <SelectItem value='churned'>Churned</SelectItem>
                  <SelectItem value='opportunity'>Opportunity</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='source'>Source</Label>
              <Combobox
                value={editForm.source}
                onChange={(value) => setEditForm({ ...editForm, source: value })}
                items={sources}
                placeholder='Select source...'
                searchPlaceholder='Search source...'
                groupHeading='Sources'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='priority'>Priority</Label>
              <Select value={editForm.priority} onValueChange={(value) => setEditForm({ ...editForm, priority: value as Priority })}>
                <SelectTrigger>
                  <SelectValue placeholder='Select priority' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='high'>High</SelectItem>
                  <SelectItem value='medium'>Medium</SelectItem>
                  <SelectItem value='low'>Low</SelectItem>
                </SelectContent>
              </Select>
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
            <h2 className='mb-4 font-semibold text-lg'>Date Focus</h2>
            <div className='grid grid-cols-4 gap-4'>
              <div>
                <p className='text-gray-500 text-sm'>Created Date</p>
                <p className='text-sm'>{formatDate(new Date(contact?.createdAt || ''))}</p>
              </div>
              <div>
                <p className='text-gray-500 text-sm'>Stage</p>
                <Select value={contact?.status || 'lead'} onValueChange={handleStatusChange}>
                  <SelectTrigger className='h-8'>
                    <SelectValue>
                      <ColorBadge type='status' value={contact?.status || 'lead'} />
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='lead'>
                      <ColorBadge type='status' value='lead' />
                    </SelectItem>
                    <SelectItem value='prospect'>
                      <ColorBadge type='status' value='prospect' />
                    </SelectItem>
                    <SelectItem value='customer'>
                      <ColorBadge type='status' value='customer' />
                    </SelectItem>
                    <SelectItem value='churned'>
                      <ColorBadge type='status' value='churned' />
                    </SelectItem>
                    <SelectItem value='opportunity'>
                      <ColorBadge type='status' value='opportunity' />
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className='text-gray-500 text-sm'>Priority</p>
                <Select value={contact?.priority || 'medium'} onValueChange={handlePriorityChange}>
                  <SelectTrigger className='h-8'>
                    <SelectValue>
                      <ColorBadge type='priority' value={contact?.priority || 'medium'} />
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='high'>
                      <ColorBadge type='priority' value='high' />
                    </SelectItem>
                    <SelectItem value='medium'>
                      <ColorBadge type='priority' value='medium' />
                    </SelectItem>
                    <SelectItem value='low'>
                      <ColorBadge type='priority' value='low' />
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className='text-gray-500 text-sm'>Last Contacted</p>
                <p className='text-sm'>{contact?.lastContactedAt ? formatDate(new Date(contact?.lastContactedAt)) : '—'}</p>
              </div>
            </div>
          </div>

          <div className='h-96 rounded-lg border p-4'>
            <div className='mb-4 flex items-center justify-between'>
              <h2 className='font-semibold text-lg'>Activity</h2>
              <Button variant='outline' size='sm'>
                Unsubscribe
              </Button>
            </div>

            <div className='flex h-[calc(100%-48px)] flex-col'>
              {activities && activities.length > 0 ? (
                <div className='relative flex-1 space-y-4 overflow-y-auto'>
                  {activities
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((activity) => (
                      <div key={activity.id} className='relative pl-6'>
                        <div className='absolute top-2 left-0 size-2 rounded-full bg-green-500' />
                        <div className='absolute top-4 bottom-0 left-[3.5px] w-[1px] bg-gray-200' />

                        <div className='flex flex-col gap-1'>
                          <div className='flex items-center gap-2'>
                            <span className='font-medium'>{activity.title}</span>
                            <span className='text-gray-500 text-sm'>
                              • by {getInitiatorLabel(activity)} • {formatDate(new Date(activity.createdAt))}
                            </span>
                          </div>
                          <p className='text-gray-500 text-sm'>{activity.description}</p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className='flex flex-1 items-center justify-center py-8 text-gray-500'>
                  <p>No activities found.</p>
                </div>
              )}

              <form onSubmit={handleSubmitActivity} className='mt-4'>
                <div className='flex gap-2'>
                  <Input value={newActivity} onChange={(e) => setNewActivity(e.target.value)} placeholder='Leave a comment...' className='flex-1' />
                  <Button type='submit' size='icon' variant='ghost' disabled={createContactActivity.isPending}>
                    <Send className='size-4' />
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className='space-y-6 p-6'>
          <div className='space-y-1 rounded-lg border p-4'>
            <h2 className='mb-2 font-semibold text-lg'>Personal Information</h2>
            <p className='text-gray-500 text-sm'>Company: {contact?.company || 'Unknown'}</p>
            <p className='text-gray-500 text-sm'>Phone: {contact?.phone || '—'}</p>
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
                  <div key={payment.id}>
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
