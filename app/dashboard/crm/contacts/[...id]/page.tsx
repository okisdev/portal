'use client';

import { ColorBadge } from '@/components/shared/color-badge';
import { Combobox } from '@/components/shared/combobox';
import { DateTimePicker } from '@/components/shared/date-time-picker';
import { EventDialog } from '@/components/shared/event-dialog';
import { PageLoading } from '@/components/shared/page-loading';
import { PhoneInput } from '@/components/shared/phone-input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { insuranceCompanies, sources } from '@/data/data';
import type { Priority, Status } from '@/lib/schema';
import { cn, formatDate } from '@/lib/utils';
import { api } from '@/utils/trpc/client';
import { Building2, Calendar, CalendarIcon, Edit2, Mail, MoreHorizontal, Phone, Trash2, Users } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { notFound, useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ContactIdPage() {
  const router = useRouter();
  const { id: contactId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');

  const { data: session } = useSession();

  const utils = api.useUtils();

  const { data: contact, isLoading } = api.contact.getContactById.useQuery({
    id: contactId[0],
  });
  const { data: activities, refetch: refetchActivities } = api.contact.getContactActivities.useQuery({
    id: contactId[0],
  });
  const { data: payments } = api.pay.getPaymentByContactEmail.useQuery({ email: contact?.email || '' }, { enabled: !!contact?.email });
  const { data: appointments } = api.calendar.getAppointmentsByContactId.useQuery({
    contactId: contactId[0],
  });
  const { data: allTeams } = api.team.getAllTeams.useQuery();

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
    notes: '',
  });

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState<Date>();
  const [appointmentNotes, setAppointmentNotes] = useState('');
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [editingAppointment, setEditingAppointment] = useState<{
    id: string;
    title: string;
    description: string;
    startAt: Date;
  } | null>(null);

  const assignToTeam = api.team.assignContactToTeam.useMutation({
    onSuccess: () => {
      setIsTeamModalOpen(false);
      utils.contact.getContactById.invalidate({ id: contactId });
    },
  });

  const updateContact = api.contact.updateContact.useMutation({
    onSuccess: () => {
      handleCloseEditModal();
      utils.contact.getContactById.invalidate({ id: contactId[0] });
    },
  });

  const createAppointment = api.calendar.createAppointment.useMutation({
    onSuccess: () => {
      setIsBookingModalOpen(false);
      setAppointmentDate(undefined);
      setAppointmentNotes('');
    },
  });

  const deleteAppointment = api.calendar.deleteEvent.useMutation({
    onSuccess: () => {
      utils.calendar.getAppointmentsByContactId.invalidate({ contactId: contactId[0] });
    },
  });

  const updateAppointment = api.calendar.updateEvent.useMutation({
    onSuccess: () => {
      setEditingAppointment(null);
      utils.calendar.getAppointmentsByContactId.invalidate({ contactId: contactId[0] });
    },
  });

  const handleEditAppointment = (data: any) => {
    if (!editingAppointment) return;

    updateAppointment.mutate({
      id: editingAppointment.id,
      title: data.title,
      description: data.description,
      startAt: data.startAt,
      endAt: data.endAt,
    });
  };

  useEffect(() => {
    if (mode === 'edit' && contact) {
      setEditForm({
        firstName: contact.firstName || '',
        lastName: contact.lastName || '',
        email: contact.email || '',
        phone: contact.phone || '',
        company: contact.company || '',
        status: contact.status || 'lead',
        source: contact.source || '',
        priority: contact.priority || 'low',
        notes: contact.notes || '',
      });
      setIsEditModalOpen(true);
    }
  }, [mode, contact]);

  if (isLoading) {
    return <PageLoading />;
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

  const handleEditClick = () => {
    setEditForm({
      firstName: contact?.firstName || '',
      lastName: contact?.lastName || '',
      email: contact?.email || '',
      phone: contact?.phone || '',
      company: contact?.company || '',
      status: contact?.status || 'lead',
      source: contact?.source || '',
      priority: contact?.priority || 'low',
      notes: contact?.notes || '',
    });
    setIsEditModalOpen(true);
  };

  const handleAssignTeam = () => {
    if (!selectedTeam) return;

    assignToTeam.mutate({
      contactId,
      teamId: selectedTeam,
    });
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
      notes: editForm.notes,
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
      notes: contact?.notes || '',
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
      notes: contact?.notes || '',
    });
  };

  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault();

    if (!appointmentDate) return;

    createAppointment.mutate({
      title: `Meeting with ${contact?.name}`,
      description: appointmentNotes,
      date: appointmentDate,
      contactId: contactId[0],
    });
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.delete('mode');
    const newUrl = `${window.location.pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    router.replace(newUrl);
  };

  return (
    <div className='container mx-auto space-y-6 p-6'>
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        {/* Left Panel - Contact Info */}
        <div className='lg:col-span-1'>
          <div className='rounded-lg border bg-white shadow-sm'>
            {/* Contact Header */}
            <div className='p-6 border-b'>
              <div className='flex items-start gap-4'>
                <Avatar className='size-16'>
                  <AvatarImage src='' />
                  <AvatarFallback>{contact?.name?.charAt(0) || ''}</AvatarFallback>
                </Avatar>
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2 mb-2'>
                    <h1 className='text-xl font-semibold truncate'>{contact?.name}</h1>
                    <ColorBadge type='contactStatus' value={contact?.status || 'lead'} />
                  </div>
                  <div className='space-y-1 text-sm text-muted-foreground'>
                    {contact?.company && (
                      <div className='flex items-center gap-2'>
                        <Building2 className='size-4 shrink-0' />
                        <span className='truncate'>{contact.company}</span>
                      </div>
                    )}
                    {contact?.teams && contact.teams.length > 0 && (
                      <div className='flex items-center gap-2'>
                        <Users className='size-4 shrink-0' />
                        <div className='flex flex-wrap gap-1'>
                          {contact?.teams?.map((team) => (
                            <Link key={team.id} href={`/dashboard/crm/contacts/team/${team.id}`} className='hover:text-primary'>
                              {team.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                    {contact?.email && (
                      <Link href={`mailto:${contact.email}`} className='flex items-center gap-2 hover:text-primary'>
                        <Mail className='size-4 shrink-0' />
                        <span className='truncate'>{contact.email}</span>
                      </Link>
                    )}
                    {contact?.phone && (
                      <Link href={`https://wa.me/${contact.phone.replace(/\D/g, '')}`} className='flex items-center gap-2 hover:text-primary'>
                        <Phone className='size-4 shrink-0' />
                        <span>{contact.phone}</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='px-6 py-4 border-b'>
              <div className='flex gap-3'>
                <Button variant='outline' size='sm' className='flex-1' onClick={() => setIsBookingModalOpen(true)}>
                  <CalendarIcon className='mr-2 size-4' /> Book Meeting
                </Button>
                <Button variant='outline' size='sm' className='flex-1' onClick={handleEditClick}>
                  <Edit2 className='mr-2 size-4' /> Edit
                </Button>
              </div>
            </div>

            {/* Contact Stats */}
            <div className='p-6 border-b'>
              <div className='grid grid-cols-1 gap-4'>
                {[
                  { label: 'Last Contact', value: contact?.lastContactedAt ? formatDate(new Date(contact.lastContactedAt)) : '—' },
                  {
                    label: 'Priority',
                    value: (
                      <Select value={contact?.priority || 'medium'} onValueChange={handlePriorityChange}>
                        <SelectTrigger className='h-8'>
                          <SelectValue>
                            <ColorBadge type='priority' value={contact?.priority || 'medium'} />
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {['high', 'medium', 'low'].map((priority) => (
                            <SelectItem key={priority} value={priority}>
                              <ColorBadge type='priority' value={priority} />
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ),
                  },
                  {
                    label: 'Status',
                    value: (
                      <Select value={contact?.status || 'lead'} onValueChange={handleStatusChange}>
                        <SelectTrigger className='h-8'>
                          <SelectValue>
                            <ColorBadge type='contactStatus' value={contact?.status || 'lead'} />
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {['lead', 'prospect', 'customer', 'churned', 'opportunity'].map((status) => (
                            <SelectItem key={status} value={status}>
                              <ColorBadge type='contactStatus' value={status} />
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ),
                  },
                ].map((item) => (
                  <div key={item.label} className='space-y-1.5'>
                    <div className='text-sm text-muted-foreground'>{item.label}</div>
                    <div>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Notes */}
            <div className='p-6 border-b'>
              <div className='flex items-center justify-between mb-4'>
                <h2 className='font-medium'>Quick Notes</h2>
                <Button variant='outline' size='sm' onClick={handleEditClick}>
                  <Edit2 className='mr-2 size-4' /> Edit Notes
                </Button>
              </div>
              <p className='text-sm text-muted-foreground whitespace-pre-wrap'>{contact?.notes || 'No notes added yet. Click edit to add notes about this contact.'}</p>
            </div>

            {/* Upcoming Meetings */}
            <div className='p-6 border-b'>
              <h2 className='font-medium mb-4'>Upcoming Meetings</h2>
              <div className='space-y-4'>
                {appointments?.map((apt) => (
                  <div key={apt.id} className='flex items-center gap-3'>
                    <Calendar className='size-4 text-muted-foreground shrink-0' />
                    <div className='flex-1 min-w-0'>
                      <p className='font-medium truncate'>{apt.title}</p>
                      <p className='text-sm text-muted-foreground'>{formatDate(new Date(apt.startAt))}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='icon' className='shrink-0'>
                          <MoreHorizontal className='size-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuItem
                          onClick={() =>
                            setEditingAppointment({
                              id: apt.id,
                              title: apt.title,
                              description: apt.description || '',
                              startAt: new Date(apt.startAt),
                            })
                          }
                        >
                          <Edit2 className='mr-2 size-4' />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className='text-destructive' onClick={() => deleteAppointment.mutate(apt.id)}>
                          <Trash2 className='mr-2 size-4' />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Payments */}
            <div className='p-6 border-b'>
              <h2 className='font-medium mb-4'>Recent Payments</h2>
              <div className='space-y-3'>
                {payments?.slice(0, 3).map((payment) => (
                  <div key={payment.id} className='flex items-center justify-between'>
                    <span className='text-sm text-muted-foreground'>{formatDate(new Date(payment.created * 1000))}</span>
                    <span className={cn('font-medium', payment.status === 'succeeded' ? 'text-green-600' : 'text-destructive')}>
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: payment.currency,
                      }).format(payment.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Team Roles */}
            <div className='p-6'>
              <h2 className='font-medium mb-4'>Team Roles</h2>
              <div className='space-y-3'>
                {contact?.leadingTeams?.map((team) => (
                  <div key={team.id} className='flex items-center justify-between'>
                    <Link href={`/dashboard/crm/contacts/team/${team.id}`} className='text-sm hover:text-primary'>
                      {team.name}
                    </Link>
                    <span className='text-xs text-muted-foreground'>Team Leader</span>
                  </div>
                ))}
                {contact?.subLeadingTeams?.map((team) => (
                  <div key={team.id} className='flex items-center justify-between'>
                    <Link href={`/dashboard/crm/contacts/team/${team.id}`} className='text-sm hover:text-primary'>
                      {team.name}
                    </Link>
                    <span className='text-xs text-muted-foreground'>Sub Leader</span>
                  </div>
                ))}
                {contact?.referralTeams?.map((team) => (
                  <div key={team.id} className='flex items-center justify-between'>
                    <Link href={`/dashboard/crm/contacts/team/${team.id}`} className='text-sm hover:text-primary'>
                      {team.name}
                    </Link>
                    <span className='text-xs text-muted-foreground'>Referral</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Activity Feed */}
        <div className='lg:col-span-2'>
          <div className='rounded-lg border bg-white shadow-sm'>
            <div className='p-6'>
              <div className='flex items-center justify-between mb-6'>
                <h2 className='font-medium'>Activity History</h2>
              </div>

              <div className='space-y-4 max-h-[calc(100vh-16rem)] overflow-y-auto'>
                {activities?.map((activity) => (
                  <div key={activity.id} className='flex gap-4 pb-4 border-b last:border-0'>
                    <div className='mt-1.5 size-2 rounded-full bg-primary shrink-0' />
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2 mb-1'>
                        <span className='font-medium text-sm'>{activity.title}</span>
                        <span className='text-xs text-muted-foreground'>
                          by {getInitiatorLabel(activity)} - {formatDate(new Date(activity.createdAt))}
                        </span>
                      </div>
                      <p className='text-sm text-muted-foreground'>{activity.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isEditModalOpen} onOpenChange={handleCloseEditModal}>
        <DialogContent className='max-h-[90vh] max-w-xl overflow-y-auto'>
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
            <div className='space-y-2'>
              <Label htmlFor='notes'>Quick Notes</Label>
              <Textarea
                id='notes'
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder='Add quick notes about the contact (e.g., easy-going, likes pets)'
              />
            </div>
            <div className='flex justify-end space-x-2'>
              <Button type='button' variant='outline' onClick={handleCloseEditModal}>
                Cancel
              </Button>
              <Button type='submit' disabled={updateContact.isPending}>
                {updateContact.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
        <DialogContent className='max-h-[90vh] max-w-xl overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleBookAppointment} className='space-y-4'>
            <div className='space-y-2'>
              <Label>Date and Time</Label>
              <DateTimePicker value={appointmentDate || new Date()} onChange={setAppointmentDate} showTimePicker={true} />
            </div>
            <div className='space-y-2'>
              <Label>Notes</Label>
              <Textarea value={appointmentNotes} onChange={(e) => setAppointmentNotes(e.target.value)} placeholder='Add any notes about the appointment...' />
            </div>
            <div className='flex justify-end space-x-2'>
              <Button type='button' variant='outline' onClick={() => setIsBookingModalOpen(false)}>
                Cancel
              </Button>
              <Button type='submit' disabled={createAppointment.isPending || !appointmentDate}>
                {createAppointment.isPending ? 'Booking...' : 'Book Appointment'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isTeamModalOpen} onOpenChange={setIsTeamModalOpen}>
        <DialogContent className='max-h-[90vh] max-w-xl overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Assign to Team</DialogTitle>
          </DialogHeader>

          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label>Select Team</Label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger>
                  <SelectValue placeholder='Select a team' />
                </SelectTrigger>
                <SelectContent>
                  {allTeams?.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='flex justify-end gap-2'>
              <Button onClick={handleAssignTeam} disabled={assignToTeam.isPending || !selectedTeam}>
                Assign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <EventDialog
        open={!!editingAppointment}
        onOpenChange={(open) => !open && setEditingAppointment(null)}
        onSubmit={handleEditAppointment}
        isEditMode={true}
        key={editingAppointment?.id}
        defaultValues={
          editingAppointment
            ? {
                title: editingAppointment.title,
                description: editingAppointment.description,
                startAt: new Date(editingAppointment.startAt),
                endAt: new Date(editingAppointment.startAt.getTime() + 30 * 60000),
              }
            : undefined
        }
        folders={[{ id: 'default', name: 'Default Calendar' }]}
      />
    </div>
  );
}
