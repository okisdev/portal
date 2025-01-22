'use client';

import { SendEmail } from '@/components/dashboard/contact/send-email';
import { SendMessage } from '@/components/dashboard/contact/send-message';
import { ColorBadge } from '@/components/shared/color-badge';
import { Combobox } from '@/components/shared/combobox';
import { EventDialog } from '@/components/shared/event-dialog';
import type { EventFormData } from '@/components/shared/event-dialog';
import { NameTag } from '@/components/shared/name-tag';
import { PageLoading } from '@/components/shared/page-loading';
import { PhoneInput } from '@/components/shared/phone-input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {} from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { insuranceCompanies, sources } from '@/data/data';
import { type Priority, type Status, statusSchema } from '@/lib/schema';
import { cn, formatDate } from '@/lib/utils';
import { api } from '@/utils/trpc/client';
import { ArrowUpRight, Building2, Calendar, Edit2, Mail, MessageSquare, MoreHorizontal, Phone, Plus, Save, Send, Trash2, Users, X } from 'lucide-react';
import { Info } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { notFound, useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function ContactIdPage() {
  const router = useRouter();
  const { id: contactId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const t = useTranslations();

  const { data: session } = useSession();

  const utils = api.useUtils();

  const { data: contact, isLoading } = api.contact.getContactById.useQuery({
    id: contactId[0],
  });
  const { data: activities } = api.contact.getContactActivities.useQuery({
    id: contactId[0],
  });
  const { data: payments } = api.pay.getPaymentByContactEmail.useQuery({ email: contact?.email || '' }, { enabled: !!contact?.email });
  const { data: appointments } = api.calendar.getAppointmentsByContactId.useQuery({
    contactId: contactId[0],
  });
  const { data: allTeams } = api.team.getAllTeams.useQuery();
  const { data: calendarFolders } = api.calendar.getFolders.useQuery();

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

  const [newActivity, setNewActivity] = useState('');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [highlightedNote, setHighlightedNote] = useState<string | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<{
    id: string;
    title: string;
    description: string;
    startAt: Date;
  } | null>(null);
  const [isNotesEditing, setIsNotesEditing] = useState(false);
  const [editableRemark, setEditableRemark] = useState('');
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

  const assignToTeam = api.team.assignContactToTeam.useMutation({
    onSuccess: () => {
      setIsTeamModalOpen(false);
      utils.contact.getContactById.invalidate({ id: contactId });
      utils.contact.getContactActivities.invalidate({ id: contactId });
    },
  });

  const updateContact = api.contact.updateContact.useMutation({
    onSuccess: () => {
      handleCloseEditModal();
      utils.contact.getContactById.invalidate({ id: contactId[0] });
      utils.contact.getContactActivities.invalidate({ id: contactId[0] });
      toast.success('Contact updated successfully');
    },
  });

  const updateContactRemark = api.contact.updateContactRemark.useMutation({
    onSuccess: () => {
      utils.contact.getContactById.invalidate({ id: contactId[0] });
      utils.contact.getContactActivities.invalidate({ id: contactId[0] });
      toast.success('Contact remark updated successfully');
    },
  });

  const createAppointment = api.calendar.createAppointment.useMutation({
    onSuccess: () => {
      setIsBookingModalOpen(false);
      utils.calendar.getAppointmentsByContactId.invalidate({ contactId: contactId[0] });
      utils.contact.getContactById.invalidate({ id: contactId[0] });
      utils.contact.getContactActivities.invalidate({ id: contactId[0] });
      toast.success('Appointment created successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteAppointment = api.calendar.deleteEvent.useMutation({
    onSuccess: () => {
      utils.calendar.getAppointmentsByContactId.invalidate({ contactId: contactId[0] });
      utils.contact.getContactActivities.invalidate({ id: contactId[0] });
      toast.success('Appointment deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateAppointment = api.calendar.updateEvent.useMutation({
    onSuccess: () => {
      setEditingAppointment(null);
      utils.calendar.getAppointmentsByContactId.invalidate({ contactId: contactId[0] });
      utils.contact.getContactActivities.invalidate({ id: contactId[0] });
      toast.success('Appointment updated successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const createContactActivity = api.contact.createContactActivity.useMutation({
    onSuccess: () => {
      setNewActivity('');
      utils.contact.getContactActivities.invalidate({ id: contactId[0] });
      toast.success('Activity created successfully');
    },
    onError: (error) => {
      toast.error(error.message);
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

  const handleSaveNotes = () => {
    updateContactRemark.mutate({
      id: contactId[0],
      remark: editableRemark,
    });
    setIsNotesEditing(false);
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
      });
      setIsEditModalOpen(true);
    }
  }, [mode, contact]);

  useEffect(() => {
    if (contact?.remark) {
      setEditableRemark(contact.remark);
    }
  }, [contact?.remark]);

  if (isLoading) {
    return <PageLoading />;
  }

  if (!isLoading && !contact) {
    notFound();
  }

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
    });
    setIsEditModalOpen(true);
  };

  const handleOpenBookingModal = () => {
    setIsBookingModalOpen(true);
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

  const handleBookAppointment = (data: EventFormData) => {
    createAppointment.mutate({
      title: data.title,
      description: data.description || '',
      startAt: data.startAt,
      endAt: data.endAt,
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

  const handleSubmitActivity = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newActivity.trim()) {
      toast.error('Activity cannot be empty');
      return;
    }

    createContactActivity.mutate({
      contactId: contactId[0],
      type: 'NOTE_ADDED',
      initiatorType: 'user',
      initiatorId: session?.user.id || '',
      title: 'Note Added',
      description: newActivity,
    });
  };

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!replyText.trim() || !replyingTo) {
      toast.error('Reply cannot be empty');
      return;
    }

    createContactActivity.mutate({
      contactId: contactId[0],
      type: 'NOTE_ADDED',
      initiatorType: 'user',
      initiatorId: session?.user.id || '',
      title: 'Note Reply',
      description: replyText,
      metadata: { replyTo: replyingTo },
    });

    setReplyText('');
    setReplyingTo(null);
  };

  const scrollToNote = (noteId: string) => {
    const element = document.getElementById(`note-${noteId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedNote(noteId);
      setTimeout(() => setHighlightedNote(null), 2000);
    }
  };

  return (
    <div className='container mx-auto min-h-[calc(100vh-4rem)] space-y-6 p-6'>
      <div className='grid h-[calc(100vh-6rem)] grid-cols-1 gap-6 lg:grid-cols-3'>
        <div className='overflow-y-auto lg:col-span-1'>
          <div className='rounded-lg border bg-card text-card-foreground shadow-sm'>
            <div className='border-b p-6'>
              <div className='flex items-start gap-4'>
                <Avatar className='size-16'>
                  <AvatarImage src='' />
                  <AvatarFallback>{contact?.name?.charAt(0) || ''}</AvatarFallback>
                </Avatar>
                <div className='min-w-0 flex-1'>
                  <div className='mb-2 flex items-center gap-2'>
                    <h1 className='truncate font-semibold text-foreground text-xl'>{contact?.name}</h1>
                  </div>
                  <div className='space-y-1 text-muted-foreground text-sm'>
                    {contact?.company && (
                      <div className='flex items-center gap-2'>
                        <Building2 className='size-4 shrink-0' />
                        <Link href={`/dashboard/crm/contacts?company=${contact.company}`} className='hover:text-primary'>
                          {contact.company}
                        </Link>
                      </div>
                    )}
                    {contact?.teams && contact.teams.length > 0 && (
                      <div className='flex items-center gap-2'>
                        <Users className='size-4 shrink-0' />
                        <div className='flex flex-wrap gap-1'>
                          {contact?.teams?.map((team) => (
                            <Link key={team.id} href={`/dashboard/crm/team/${team.id}`} className='hover:text-primary'>
                              {team.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                    {contact?.email && (
                      <Link href={`mailto:${contact.email}`} target='_blank' rel='noopener noreferrer' className='flex items-center gap-2 hover:text-primary'>
                        <Mail className='size-4 shrink-0' />
                        <span className='truncate'>{contact.email}</span>
                      </Link>
                    )}
                    {contact?.phone && (
                      <Link href={`https://wa.me/${contact.phone.replace(/\D/g, '')}`} target='_blank' rel='noopener noreferrer' className='flex items-center gap-2 hover:text-primary'>
                        <Phone className='size-4 shrink-0' />
                        <span>{contact.phone}</span>
                      </Link>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button type='button' className='my-1 text-muted-foreground outline-none hover:text-foreground'>
                      <MoreHorizontal className='size-4' />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='bg-popover text-popover-foreground'>
                    <DropdownMenuItem onClick={handleEditClick} className='cursor-pointer'>
                      <Edit2 className='mr-2 size-4' />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className='cursor-pointer'>
                        <Send className='mr-2 size-4' />
                        Send
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem onClick={() => setIsEmailModalOpen(true)} className='cursor-pointer'>
                            <Mail className='mr-2 size-4' />
                            Email
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setIsMessageModalOpen(true)} className='cursor-pointer'>
                            <MessageSquare className='mr-2 size-4' />
                            Message
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className='border-b p-6'>
              <div className='grid grid-cols-1 gap-4'>
                <div className='grid grid-cols-2 gap-4'>
                  {[
                    { label: 'Last Contact', value: contact?.lastContactedAt ? formatDate(new Date(contact.lastContactedAt)) : '—' },
                    { label: 'Source', value: contact?.source || '—' },
                  ].map((item) => (
                    <div key={item.label} className='space-y-1.5'>
                      <div className='text-muted-foreground text-xs'>{item.label}</div>
                      <div className='text-foreground text-sm'>{item.value}</div>
                    </div>
                  ))}
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-1.5'>
                    <div className='text-muted-foreground text-xs'>Priority</div>
                    <div className='text-foreground'>
                      <Select value={contact?.priority || 'medium'} onValueChange={handlePriorityChange}>
                        <SelectTrigger className='h-8'>
                          <SelectValue>
                            <ColorBadge type='priority' value={contact?.priority || 'medium'} />
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className='bg-popover text-popover-foreground'>
                          {['high', 'medium', 'low'].map((priority) => (
                            <SelectItem key={priority} value={priority}>
                              <ColorBadge type='priority' value={priority} />
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className='space-y-1.5'>
                    <div className='text-muted-foreground text-xs'>Status</div>
                    <div className='text-foreground'>
                      <Select value={contact?.status || 'lead'} onValueChange={handleStatusChange}>
                        <SelectTrigger className='h-8'>
                          <SelectValue>
                            <ColorBadge type='contactStatus' value={contact?.status || 'lead'} />
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className='bg-popover text-popover-foreground'>
                          {statusSchema.options.map((status) => (
                            <SelectItem key={status} value={status}>
                              <ColorBadge type='contactStatus' value={status} />
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className='space-y-2 border-b p-6'>
              <div className='flex items-center justify-between'>
                <h2 className='font-medium text-foreground'>{t('remark')}</h2>
                <button
                  type='button'
                  className='text-muted-foreground hover:text-foreground'
                  onClick={() => {
                    if (isNotesEditing) {
                      if (contact?.remark === editableRemark) {
                        setEditableRemark('');
                        setIsNotesEditing(false);
                        return;
                      }
                      handleSaveNotes();
                    } else {
                      setIsNotesEditing(true);
                    }
                  }}
                >
                  {isNotesEditing ? (
                    <div className='flex items-center gap-2'>
                      <X className='size-4' />
                      <Save className='size-4' />
                    </div>
                  ) : (
                    <Edit2 className='size-4' />
                  )}
                </button>
              </div>
              {isNotesEditing ? (
                <Textarea value={editableRemark} onChange={(e) => setEditableRemark(e.target.value)} className='min-h-[100px] bg-background' placeholder='Add remark about this contact...' />
              ) : (
                <p className='whitespace-pre-wrap text-muted-foreground text-sm'>{contact?.remark || 'No remark added yet. Click edit to add remark about this contact.'}</p>
              )}
            </div>

            <div className='space-y-2 border-b p-6'>
              <div className='flex items-center justify-between'>
                <h2 className='font-medium text-foreground'>Meetings</h2>
                <button type='button' className='text-muted-foreground hover:text-foreground' onClick={handleOpenBookingModal}>
                  <Plus className='size-4' />
                </button>
              </div>
              <div className='space-y-4'>
                {appointments?.length === 0 && <p className='text-muted-foreground text-sm'>No meetings found.</p>}
                {appointments?.map((apt) => (
                  <div key={apt.id} className='flex items-center gap-3'>
                    <Calendar className='size-4 shrink-0 text-muted-foreground' />
                    <div className='min-w-0 flex-1'>
                      <p className='truncate font-medium text-foreground text-sm'>{apt.title}</p>
                      <p className='text-muted-foreground text-xs'>{formatDate(new Date(apt.startAt))}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button type='button' className='shrink-0 text-muted-foreground hover:text-foreground'>
                          <MoreHorizontal className='size-4' />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end' className='bg-popover text-popover-foreground'>
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

            <div className='space-y-2 border-b p-6'>
              <div className='flex items-center justify-between'>
                <h2 className='font-medium text-foreground'>Payments</h2>
                <button type='button' className='text-muted-foreground hover:text-foreground'>
                  <Plus className='size-4' />
                </button>
              </div>
              <div className='space-y-3'>
                {payments?.length === 0 && <p className='text-muted-foreground text-sm'>No payments found.</p>}
                {payments?.slice(0, 3).map((payment) => (
                  <div key={payment.id} className='flex items-center justify-between'>
                    <span className='text-muted-foreground text-sm'>{formatDate(new Date(payment.created * 1000))}</span>
                    <span className={cn('font-medium', payment.status === 'succeeded' ? 'text-green-600 dark:text-green-400' : 'text-destructive')}>
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: payment.currency,
                      }).format(payment.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className='p-6'>
              <h2 className='mb-4 font-medium'>Team Roles</h2>
              <div className='space-y-3'>
                {contact?.leadingTeams?.length === 0 && contact?.subLeadingTeams?.length === 0 && contact?.referralTeams?.length === 0 && (
                  <p className='text-muted-foreground text-sm'>No team roles found.</p>
                )}
                {contact?.leadingTeams?.map((team) => (
                  <div key={team.id} className='flex items-center justify-between'>
                    <Link href={`/dashboard/crm/team/${team.id}`} className='text-sm hover:text-primary'>
                      {team.name}
                    </Link>
                    <span className='text-muted-foreground text-xs'>Team Leader</span>
                  </div>
                ))}
                {contact?.subLeadingTeams?.map((team) => (
                  <div key={team.id} className='flex items-center justify-between'>
                    <Link href={`/dashboard/crm/team/${team.id}`} className='text-sm hover:text-primary'>
                      {team.name}
                    </Link>
                    <span className='text-muted-foreground text-xs'>Sub Leader</span>
                  </div>
                ))}
                {contact?.referralTeams?.map((team) => (
                  <div key={team.id} className='flex items-center justify-between'>
                    <Link href={`/dashboard/crm/team/${team.id}`} className='text-sm hover:text-primary'>
                      {team.name}
                    </Link>
                    <span className='text-muted-foreground text-xs'>Referral</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className='h-full lg:col-span-2'>
          <div className='h-full rounded-lg border bg-card text-card-foreground shadow-sm'>
            <div className='h-full p-6'>
              <Tabs defaultValue='activity' className='flex h-full flex-col'>
                <TabsList className='grid w-full grid-cols-3'>
                  <TabsTrigger value='activity'>Activity</TabsTrigger>
                  <TabsTrigger value='subscription'>Subscription</TabsTrigger>
                  <TabsTrigger value='management'>Management</TabsTrigger>
                </TabsList>
                <TabsContent value='activity' className='relative flex flex-1 flex-col'>
                  <div className='absolute inset-0 overflow-y-auto pb-[4.5rem]'>
                    <div className='space-y-1'>
                      {activities?.length === 0 && <p className='text-muted-foreground text-sm'>No activities found.</p>}
                      {activities
                        ?.filter((activity) => activity.type !== 'CONTACT_UPDATED')
                        .map((activity, index) => {
                          const currentDate = new Date(activity.createdAt).toDateString();
                          const prevDate = index > 0 ? new Date(activities[index - 1].createdAt).toDateString() : null;
                          const showDateDivider = currentDate !== prevDate;

                          return (
                            <div key={activity.id} id={`note-${activity.id}`}>
                              {showDateDivider && (
                                <div className='sticky top-0 bg-background/95 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
                                  <p className='font-medium text-muted-foreground text-sm'>{currentDate}</p>
                                </div>
                              )}
                              <div
                                className={cn(
                                  'flex items-start gap-3 border-l-2 py-3 pr-2 pl-4 hover:bg-muted/30',
                                  highlightedNote === activity.id && 'bg-neutral-500/20 dark:bg-neutral-500/50',
                                  activity.metadata && JSON.parse(activity.metadata).replyTo && 'ml-4'
                                )}
                                style={{
                                  borderLeftColor:
                                    activity.type === 'NOTE_ADDED'
                                      ? 'rgb(59 130 246)'
                                      : activity.type.startsWith('CONTACT_')
                                      ? 'rgb(34 197 94)'
                                      : activity.type.startsWith('MEETING_')
                                      ? 'rgb(168 85 247)'
                                      : activity.type.startsWith('TEAM_')
                                      ? 'rgb(234 179 8)'
                                      : activity.type.startsWith('DEAL_')
                                      ? 'rgb(236 72 153)'
                                      : activity.type.includes('STATUS')
                                      ? 'rgb(249 115 22)'
                                      : activity.type.includes('PRIORITY')
                                      ? 'rgb(239 68 68)'
                                      : activity.type.includes('PAYMENT')
                                      ? 'rgb(16 185 129)'
                                      : activity.type.includes('CAMPAIGN')
                                      ? 'rgb(250 204 21)'
                                      : activity.type.includes('EMAIL')
                                      ? 'rgb(250 204 21)'
                                      : 'rgb(156 163 175)',
                                }}
                              >
                                <div className='flex-1 space-y-1'>
                                  <div className='flex w-full items-center justify-between'>
                                    <div className='flex items-center gap-2 text-sm'>
                                      <span className='font-medium'>{activity.title}</span>
                                      <span className='text-muted-foreground text-xs'>•</span>
                                      {activity.initiatorType === 'system' ? (
                                        <span className='text-muted-foreground text-xs'>by System</span>
                                      ) : (
                                        <span className='text-muted-foreground text-xs'>
                                          by <NameTag id={activity.userId} type='user' />
                                        </span>
                                      )}
                                      <span className='text-muted-foreground text-xs'>•</span>
                                      <span className='text-muted-foreground text-xs'>{new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className='flex items-center gap-2'>
                                      {activity.metadata && (
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <button type='button' className='rounded-md bg-muted/50 px-1 py-0.5 text-muted-foreground text-xs hover:bg-muted'>
                                              <Info className='mr-1 inline-block size-3' />
                                              View Details
                                            </button>
                                          </PopoverTrigger>
                                          <PopoverContent className='w-80'>
                                            <pre className='whitespace-pre-wrap font-mono text-xs'>{JSON.stringify(JSON.parse(activity.metadata), null, 2)}</pre>
                                          </PopoverContent>
                                        </Popover>
                                      )}
                                      {activity.type === 'NOTE_ADDED' && (
                                        <button type='button' onClick={() => setReplyingTo(activity.id)} className='rounded-md bg-muted/50 px-1 py-0.5 text-muted-foreground text-xs hover:bg-muted'>
                                          Reply
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  <div className={cn('text-sm', activity.type === 'NOTE_ADDED' ? 'rounded-md bg-blue-50 p-3 dark:bg-blue-950/50' : '')}>{activity.description}</div>
                                  {replyingTo === activity.id && (
                                    <form onSubmit={handleReplySubmit} className='mt-2 flex items-start gap-2'>
                                      <div className='flex-1'>
                                        <Input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder='Write a reply...' className='h-8' />
                                      </div>
                                      <div className='flex gap-1'>
                                        <Button type='submit' size='sm' disabled={createContactActivity.isPending}>
                                          Reply
                                        </Button>
                                        <Button
                                          type='button'
                                          size='sm'
                                          variant='outline'
                                          onClick={() => {
                                            setReplyingTo(null);
                                            setReplyText('');
                                          }}
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    </form>
                                  )}
                                  {activity.metadata && JSON.parse(activity.metadata).replyTo && (
                                    <button
                                      type='button'
                                      onClick={() => scrollToNote(JSON.parse(activity.metadata as string).replyTo)}
                                      className='mt-1 flex items-center gap-1 text-muted-foreground text-xs hover:text-foreground'
                                    >
                                      <ArrowUpRight className='size-3' />
                                      Jump to original note
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                  <div className='absolute right-0 bottom-0 left-0 bg-background pt-4'>
                    <form onSubmit={handleSubmitActivity} className='flex max-w-full gap-2'>
                      <Input value={newActivity} onChange={(e) => setNewActivity(e.target.value)} placeholder='Add a note...' className='h-8' />
                      <Button type='submit' size='sm' disabled={createContactActivity.isPending}>
                        Add Note
                      </Button>
                    </form>
                  </div>
                </TabsContent>
                <TabsContent value='subscription' className='flex w-full flex-col gap-4'>
                  <p>Subscription</p>
                </TabsContent>
                <TabsContent value='management' className='flex w-full flex-col gap-4'>
                  <p>Management</p>
                </TabsContent>
              </Tabs>
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
                  {statusSchema.options.map((status) => (
                    <SelectItem key={status} value={status}>
                      <ColorBadge type='contactStatus' value={status} />
                    </SelectItem>
                  ))}
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
        folders={calendarFolders}
      />

      <EventDialog
        open={isBookingModalOpen}
        onOpenChange={setIsBookingModalOpen}
        onSubmit={handleBookAppointment}
        defaultValues={{
          title: `Meeting with ${contact?.name}`,
          startAt: new Date(),
          endAt: new Date(Date.now() + 30 * 60000),
          folderId: 'default',
        }}
        folders={calendarFolders}
      />

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

      <SendEmail open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen} recipient={contact as any} />
      <SendMessage open={isMessageModalOpen} onOpenChange={setIsMessageModalOpen} recipient={contact as any} />
    </div>
  );
}
