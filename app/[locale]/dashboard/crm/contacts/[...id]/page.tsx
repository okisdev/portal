'use client';

import { ContactActivity } from '@/components/dashboard/contact/contact-activity';
import { Payment } from '@/components/dashboard/contact/payment';
import { SendEmail } from '@/components/dashboard/contact/send-email';
import { SendWhatsAppMessage } from '@/components/dashboard/contact/send-whatsapp-message';
import { ColorBadge } from '@/components/shared/color-badge';
import { Combobox } from '@/components/shared/combobox';
import { DateTimePicker } from '@/components/shared/date-time-picker';
import { EventDialog } from '@/components/shared/event-dialog';
import type { EventFormData } from '@/components/shared/event-dialog';
import { PageLoading } from '@/components/shared/page-loading';
import { PhoneInput } from '@/components/shared/phone-input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { sources } from '@/data/data';
import { type Priority, type Status, statusSchema } from '@/lib/schema';
import { formatDate } from '@/lib/utils';
import { api } from '@/utils/trpc/client';
import { Building2, Calendar, Edit2, Mail, MessageSquare, MoreHorizontal, Phone, Plus, Save, Send, Trash2, Users, X } from 'lucide-react';
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

  const utils = api.useUtils();

  const { data: contact, isLoading } = api.contact.getContactById.useQuery({
    id: contactId[0],
  });

  const { data: appointments } = api.calendar.getAppointmentsByContactId.useQuery({
    contactId: contactId[0],
  });
  const { data: allTeams } = api.team.getAllTeams.useQuery();
  const { data: calendarFolders } = api.calendar.getMyFolders.useQuery();
  const { data: companies } = api.company.getAllCompanies.useQuery();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    companyId: null as string | null,
    status: 'lead' as Status,
    source: '',
    priority: 'medium' as Priority,
  });

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
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
  const [lastContactDate, setLastContactDate] = useState<Date | null>(contact?.lastContactedAt ? new Date(contact.lastContactedAt) : null);
  const [nextFollowUpDate, setNextFollowUpDate] = useState<Date | null>(contact?.nextFollowUpAt ? new Date(contact.nextFollowUpAt) : null);

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
        companyId: contact.companyId || null,
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

  useEffect(() => {
    if (contact?.lastContactedAt) {
      setLastContactDate(new Date(contact.lastContactedAt));
    } else {
      setLastContactDate(null);
    }
  }, [contact?.lastContactedAt]);

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
      companyId: contact?.companyId || null,
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
      companyId: editForm.companyId,
      status: editForm.status,
      source: editForm.source,
      priority: editForm.priority,
    });
  };

  const handleStatusChange = (value: Status) => {
    updateContact.mutate({
      id: contactId[0],
      status: value,
    });
  };

  const handlePriorityChange = (value: Priority) => {
    updateContact.mutate({
      id: contactId[0],
      priority: value,
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

  return (
    <div className='container mx-auto min-h-[calc(100vh-4rem)] space-y-6 p-4 sm:p-6'>
      <div className='grid min-h-[calc(100vh-6rem)] grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6'>
        <div className='h-auto overflow-y-auto lg:col-span-1'>
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
                    {contact?.createdAt && (
                      <div className='flex items-center gap-2 pt-3'>
                        <span className='text-muted-foreground text-xs'>
                          {t('created_at_via', {
                            date: formatDate(new Date(contact.createdAt)),
                            source: contact.source,
                          })}
                        </span>
                      </div>
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
                      {t('edit')}
                    </DropdownMenuItem>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className='cursor-pointer'>
                        <Send className='mr-2 size-4' />
                        {t('send')}
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem onClick={() => setIsEmailModalOpen(true)} className='cursor-pointer'>
                            <Mail className='mr-2 size-4' />
                            {t('email')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setIsMessageModalOpen(true)} className='cursor-pointer'>
                            <MessageSquare className='mr-2 size-4' />
                            {t('whatsapp')}
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className='border-b p-6'>
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <div className='space-y-1.5'>
                  <div className='flex items-center justify-between text-muted-foreground text-xs'>
                    {t('last_contact')}
                    {lastContactDate && (
                      <button
                        type='button'
                        onClick={() => {
                          setLastContactDate(null);
                          updateContact.mutate({
                            id: contactId[0],
                            lastContactedAt: null,
                          });
                        }}
                        className='text-muted-foreground hover:text-foreground'
                      >
                        <X className='size-3' />
                      </button>
                    )}
                  </div>
                  <div className='text-foreground text-sm'>
                    <DateTimePicker
                      size='sm'
                      value={lastContactDate}
                      onChange={(date) => setLastContactDate(date)}
                      onClose={() => {
                        const lastContactedAt = contact?.lastContactedAt ? new Date(contact.lastContactedAt).getTime() : null;
                        const newTime = lastContactDate?.getTime() || null;

                        if (lastContactedAt !== newTime) {
                          updateContact.mutate({
                            id: contactId[0],
                            lastContactedAt: lastContactDate || undefined,
                          });
                        }
                      }}
                    />
                  </div>
                </div>
                <div className='space-y-1.5'>
                  <div className='flex items-center justify-between text-muted-foreground text-xs'>
                    {t('next_follow_up')}
                    {nextFollowUpDate && (
                      <button
                        type='button'
                        onClick={() => {
                          setNextFollowUpDate(null);
                          updateContact.mutate({
                            id: contactId[0],
                            nextFollowUpAt: null,
                          });
                        }}
                        className='text-muted-foreground hover:text-foreground'
                      >
                        <X className='size-3' />
                      </button>
                    )}
                  </div>
                  <div className='text-foreground text-sm'>
                    <DateTimePicker
                      size='sm'
                      value={nextFollowUpDate}
                      onChange={(date) => setNextFollowUpDate(date)}
                      onClose={() => {
                        const currentTime = contact?.nextFollowUpAt ? new Date(contact.nextFollowUpAt).getTime() : null;
                        const newTime = nextFollowUpDate?.getTime() || null;

                        if (currentTime !== newTime) {
                          updateContact.mutate({
                            id: contactId[0],
                            nextFollowUpAt: nextFollowUpDate || undefined,
                          });
                        }
                      }}
                    />
                  </div>
                </div>
                <div className='space-y-1.5'>
                  <div className='text-muted-foreground text-xs'>{t('priority')}</div>
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
                  <div className='text-muted-foreground text-xs'>{t('status')}</div>
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
                <p className='whitespace-pre-wrap text-muted-foreground text-sm'>{contact?.remark || t('no_remark_added')}</p>
              )}
            </div>

            <div className='space-y-2 border-b p-6'>
              <div className='flex items-center justify-between'>
                <h2 className='font-medium text-foreground'>{t('meetings')}</h2>
                <button type='button' className='text-muted-foreground hover:text-foreground' onClick={handleOpenBookingModal}>
                  <Plus className='size-4' />
                </button>
              </div>
              <div className='space-y-4'>
                {appointments?.length === 0 && <p className='text-muted-foreground text-sm'>{t('no_meetings_found')}</p>}
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
                          {t('edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem className='text-destructive' onClick={() => deleteAppointment.mutate(apt.id)}>
                          <Trash2 className='mr-2 size-4' />
                          {t('delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            </div>

            <Payment contact={contact || {}} />

            <div className='p-6'>
              <h2 className='mb-4 font-medium'>{t('team_roles')}</h2>
              <div className='space-y-3'>
                {contact?.leadingTeams?.length === 0 && contact?.subLeadingTeams?.length === 0 && contact?.referralTeams?.length === 0 && (
                  <p className='text-muted-foreground text-sm'>{t('no_team_roles_found')}</p>
                )}
                {contact?.leadingTeams?.map((team) => (
                  <div key={team.id} className='flex items-center justify-between'>
                    <Link href={`/dashboard/crm/team/${team.id}`} className='text-sm transition-colors duration-200 hover:text-primary hover:underline'>
                      {team.name}
                    </Link>
                    <span className='text-muted-foreground text-xs'>{t('team_leader')}</span>
                  </div>
                ))}
                {contact?.subLeadingTeams?.map((team) => (
                  <div key={team.id} className='flex items-center justify-between'>
                    <Link href={`/dashboard/crm/team/${team.id}`} className='text-sm transition-colors duration-200 hover:text-primary hover:underline'>
                      {team.name}
                    </Link>
                    <span className='text-muted-foreground text-xs'>{t('sub_leader')}</span>
                  </div>
                ))}
                {contact?.referralTeams?.map((team) => (
                  <div key={team.id} className='flex items-center justify-between'>
                    <Link href={`/dashboard/crm/team/${team.id}`} className='text-sm hover:text-primary'>
                      {team.name}
                    </Link>
                    <span className='text-muted-foreground text-xs'>{t('referral')}</span>
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
                  <TabsTrigger value='activity'>{t('activity')}</TabsTrigger>
                  <TabsTrigger value='subscription'>{t('subscription')}</TabsTrigger>
                  <TabsTrigger value='management'>{t('management')}</TabsTrigger>
                </TabsList>
                <TabsContent value='activity' className='relative flex flex-1 flex-col'>
                  <ContactActivity contactId={contactId[0]} />
                </TabsContent>
                <TabsContent value='subscription' className='flex w-full flex-col gap-4'>
                  <p>{t('subscription')}</p>
                </TabsContent>
                <TabsContent value='management' className='flex w-full flex-col gap-4'>
                  <p>{t('management')}</p>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isEditModalOpen} onOpenChange={handleCloseEditModal}>
        <DialogContent className='max-h-[90vh] max-w-xl overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>{t('edit_contact_information')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit} className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='firstName'>{t('first_name')}</Label>
                <Input id='firstName' value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='lastName'>{t('last_name')}</Label>
                <Input id='lastName' value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} />
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='email'>{t('email')}</Label>
              <Input id='email' type='email' value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='phone'>{t('phone')}</Label>
              <PhoneInput id='phone' value={editForm.phone} onChange={(value) => setEditForm({ ...editForm, phone: value })} />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='company'>{t('company')}</Label>
              <Combobox
                value={editForm.company}
                onChange={(value) => {
                  const selectedCompany = companies?.find((c) => c.name === value);
                  setEditForm({
                    ...editForm,
                    company: selectedCompany ? selectedCompany.name : value,
                    companyId: selectedCompany?.id || null,
                  });
                }}
                items={companies?.map((c) => c.name) || []}
                placeholder={t('select_company')}
                searchPlaceholder={t('search_company')}
                groupHeading={t('companies')}
                allowCustom={true}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='status'>{t('status')}</Label>

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
              <Label htmlFor='source'>{t('source')}</Label>
              <Combobox
                value={editForm.source}
                onChange={(value) => setEditForm({ ...editForm, source: value })}
                items={sources}
                placeholder={t('select_source')}
                searchPlaceholder={t('search_source')}
                groupHeading={t('sources')}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='priority'>{t('priority')}</Label>
              <Select value={editForm.priority} onValueChange={(value) => setEditForm({ ...editForm, priority: value as Priority })}>
                <SelectTrigger>
                  <SelectValue placeholder='Select priority' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='high'>{t('high')}</SelectItem>
                  <SelectItem value='medium'>{t('medium')}</SelectItem>
                  <SelectItem value='low'>{t('low')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='flex justify-end space-x-2'>
              <Button type='button' variant='outline' onClick={handleCloseEditModal}>
                {t('cancel')}
              </Button>
              <Button type='submit' disabled={updateContact.isPending}>
                {updateContact.isPending ? t('saving') : t('save_changes')}
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
          title: t('meeting_with', { name: contact?.name }),
          startAt: new Date(),
          endAt: new Date(Date.now() + 30 * 60000),
          folderId: 'default',
        }}
        folders={calendarFolders}
      />

      <Dialog open={isTeamModalOpen} onOpenChange={setIsTeamModalOpen}>
        <DialogContent className='max-h-[90vh] max-w-xl overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>{t('assign_to_team')}</DialogTitle>
          </DialogHeader>

          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label>{t('select_team')}</Label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger>
                  <SelectValue placeholder={t('select_a_team')} />
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
                {t('assign')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <SendEmail open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen} recipient={contact as any} />
      <SendWhatsAppMessage open={isMessageModalOpen} onOpenChange={setIsMessageModalOpen} recipient={contact as any} />
    </div>
  );
}
