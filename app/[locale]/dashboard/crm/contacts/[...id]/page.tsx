'use client';

import {
  Building2,
  Edit2,
  Mail,
  MoreHorizontal,
  Phone,
  Save,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import {
  notFound,
  useParams,
  useRouter,
  useSearchParams,
} from 'next/navigation';
import { useTranslations } from 'next-intl';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ActionAlertDialog } from '@/components/shared/action-alert-dialog';
import { ActivitySection } from '@/components/shared/activity-section';
import { Combobox } from '@/components/shared/combobox';
import { DateTimePicker } from '@/components/shared/date-time-picker';
import type { EventFormData } from '@/components/shared/event-dialog';
import { EventDialog } from '@/components/shared/event-dialog';
import { EventSection } from '@/components/shared/event-section';
import { NameTag } from '@/components/shared/name-tag';
import { PageLoading } from '@/components/shared/page-loading';
import { PhoneInput } from '@/components/shared/phone-input';
import { SmartColorBadge } from '@/components/shared/smart-color-badge';
import { TabSwitcher } from '@/components/shared/tab-switcher';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { sources } from '@/data/data';
import type { Priority, Status } from '@/lib/schema';
import { formatDate } from '@/utils/date';
import { parsePhone } from '@/utils/phone';
import { api } from '@/utils/trpc/client';

export default function ContactIdPage() {
  const router = useRouter();
  const { id: contactId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const t = useTranslations();

  const utils = api.useUtils();

  const { data: me } = api.account.getMe.useQuery();
  const { data: contact, isLoading } = api.contact.getContactById.useQuery({
    id: contactId[0],
  });
  const { data: appointments } =
    api.calendar.getAppointmentsByContactId.useQuery({
      contactId: contactId[0],
    });
  const { data: allTeams } = api.team.getAllTeams.useQuery();
  const { data: calendarFolders } = api.calendar.getMyFolders.useQuery();
  const { data: companies } = api.company.getAllCompanies.useQuery();
  const { data: activities, refetch: refetchActivities } =
    api.contact.getContactActivities.useQuery({
      id: contactId[0],
    });
  const { data: statuses } = api.site.getStatus.useQuery();
  const { data: priorities } = api.site.getPriority.useQuery();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    companyId: null as string | null,
    status: 'Lead',
    source: 'N/A',
    priority: 'Medium',
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
  const [lastContactDate, setLastContactDate] = useState<Date | null>(
    contact?.lastContactedAt ? new Date(contact.lastContactedAt) : null
  );
  const [nextFollowUpDate, setNextFollowUpDate] = useState<Date | null>(
    contact?.nextFollowUpAt ? new Date(contact.nextFollowUpAt) : null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);

  const replyNote = api.contact.activity.replyNote.useMutation({
    onSuccess: () => {
      toast.success(t('note_replied'));
      refetchActivities();
    },
  });

  const deleteNote = api.contact.activity.deleteNote.useMutation({
    onSuccess: () => {
      toast.success(t('note_deleted'));
      refetchActivities();
    },
  });

  const updateNote = api.contact.activity.updateNote.useMutation({
    onSuccess: () => {
      toast.success(t('note_updated'));
      refetchActivities();
    },
  });

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
      toast.success(t('contact_updated_successfully'));
    },
  });

  const updateContactRemark = api.contact.updateContactRemark.useMutation({
    onSuccess: () => {
      utils.contact.getContactById.invalidate({ id: contactId[0] });
      utils.contact.getContactActivities.invalidate({ id: contactId[0] });
      toast.success(t('remark_updated_successfully'));
    },
  });

  const createContactActivity = api.contact.createContactActivity.useMutation({
    onSuccess: () => {
      utils.contact.getContactActivities.invalidate({ id: contactId[0] });
      utils.user.getUnreadNotificationsCount.invalidate();
      toast.success(t('note_added_successfully'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const createAppointment = api.calendar.createAppointment.useMutation({
    onSuccess: () => {
      setIsBookingModalOpen(false);
      utils.calendar.getAppointmentsByContactId.invalidate({
        contactId: contactId[0],
      });
      utils.contact.getContactById.invalidate({ id: contactId[0] });
      utils.contact.getContactActivities.invalidate({ id: contactId[0] });
      toast.success(t('appointment_created_successfully'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteAppointment = api.calendar.deleteEvent.useMutation({
    onSuccess: () => {
      utils.calendar.getAppointmentsByContactId.invalidate({
        contactId: contactId[0],
      });
      utils.contact.getContactActivities.invalidate({ id: contactId[0] });
      toast.success(t('appointment_deleted_successfully'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateAppointment = api.calendar.updateEvent.useMutation({
    onSuccess: () => {
      setEditingAppointment(null);
      utils.calendar.getAppointmentsByContactId.invalidate({
        contactId: contactId[0],
      });
      utils.contact.getContactActivities.invalidate({ id: contactId[0] });
      toast.success(t('appointment_updated_successfully'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteContact = api.contact.deleteContact.useMutation({
    onSuccess: () => {
      router.push('/dashboard/crm/contacts');
      toast.success(t('contact_deleted_successfully'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleEditAppointment = (data: any) => {
    if (!editingAppointment) {
      return;
    }

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
      oldRemark: contact?.remark || undefined,
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
        status: contact.status || 'Lead',
        source: contact.source || 'N/A',
        priority: contact.priority || 'Medium',
      });
      setIsEditModalOpen(true);
    }
  }, [mode, contact]);

  useEffect(() => {
    if (!isNotesEditing) {
      setEditableRemark(contact?.remark || '');
    }
  }, [isNotesEditing, contact?.remark]);

  useEffect(() => {
    if (contact?.lastContactedAt) {
      setLastContactDate(new Date(contact.lastContactedAt));
    } else {
      setLastContactDate(null);
    }
  }, [contact?.lastContactedAt]);

  useEffect(() => {
    if (contact?.nextFollowUpAt) {
      setNextFollowUpDate(new Date(contact.nextFollowUpAt));
    } else {
      setNextFollowUpDate(null);
    }
  }, [contact?.nextFollowUpAt]);

  if (isLoading) {
    return <PageLoading />;
  }

  if (!(isLoading || contact)) {
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
      status: contact?.status || 'Lead',
      source: contact?.source || 'N/A',
      priority: contact?.priority || 'Medium',
    });
    setIsEditModalOpen(true);
  };

  const handleAssignTeam = () => {
    if (!selectedTeam) {
      return;
    }

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
      email: editForm.email || undefined,
      phone: editForm.phone,
      company: editForm.company,
      companyId: editForm.companyId,
      status: editForm.status,
      source: editForm.source,
      priority: editForm.priority,
    });
  };

  const handleStatusChange = (value: string) => {
    updateContact.mutate({
      id: contactId[0],
      status: value,
    });
  };

  const handlePriorityChange = (value: string) => {
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

  const handleDeleteClick = () => {
    setContactToDelete(contactId[0]);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (contactToDelete) {
      deleteContact.mutate({ id: contactToDelete });
      setDeleteDialogOpen(false);
      setContactToDelete(null);
    }
  };

  return (
    <div className='h-full min-h-0 w-full flex-1'>
      <div className='flex h-full flex-col lg:flex-row'>
        <div className='w-full lg:w-1/3'>
          <div className='flex h-full flex-col bg-card text-card-foreground'>
            <div className='flex-none border-b p-6'>
              <div className='flex items-start gap-4'>
                <Avatar className='size-16'>
                  <AvatarImage src='' />
                  <AvatarFallback>
                    {contact?.name?.charAt(0) || ''}
                  </AvatarFallback>
                </Avatar>
                <div className='min-w-0 flex-1 space-y-1 text-muted-foreground text-sm'>
                  <h1 className='mb-2 truncate font-semibold text-foreground text-xl'>
                    {contact?.name}
                  </h1>
                  {contact?.company && (
                    <div className='flex items-center gap-2'>
                      <Building2 className='size-4 shrink-0' />
                      <Link
                        className='hover:text-primary'
                        href={`/dashboard/crm/contacts?company=${contact.company}`}
                      >
                        {contact.company}
                      </Link>
                    </div>
                  )}
                  {contact?.teams && contact.teams.length > 0 && (
                    <div className='flex items-center gap-2'>
                      <Users className='size-4 shrink-0' />
                      <div className='flex flex-wrap gap-1'>
                        {contact?.teams?.map((team, index) => (
                          <React.Fragment key={team.id}>
                            <Link
                              className='hover:text-primary'
                              href={`/dashboard/crm/team/${team.id}`}
                            >
                              {team.name}
                            </Link>
                            {index < contact.teams.length - 1 && ', '}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )}
                  {contact?.email && (
                    <Link
                      className='flex items-center gap-2 hover:text-primary'
                      href={`mailto:${contact.email}`}
                      rel='noopener noreferrer'
                      target='_blank'
                    >
                      <Mail className='size-4 shrink-0' />
                      <span className='truncate'>{contact.email}</span>
                    </Link>
                  )}
                  {contact?.phone && (
                    <Link
                      className='flex items-center gap-2 hover:text-primary'
                      href={`https://wa.me/${contact.phone.replace(/\D/g, '')}`}
                      rel='noopener noreferrer'
                      target='_blank'
                    >
                      <Phone className='size-4 shrink-0' />
                      <span>{parsePhone(contact.phone)}</span>
                    </Link>
                  )}
                  {contact?.createdAt && (
                    <span className='block pt-3 text-xs'>
                      {contact.createdBy
                        ? contact.source
                          ? t.rich('created_at_via_by', {
                              date: formatDate(new Date(contact.createdAt)),
                              source: contact.source,
                              user: () =>
                                contact.createdBy ? (
                                  <NameTag id={contact.createdBy} type='user' />
                                ) : null,
                            })
                          : t.rich('created_at_date_by', {
                              date: formatDate(new Date(contact.createdAt)),
                              user: () =>
                                contact.createdBy ? (
                                  <NameTag id={contact.createdBy} type='user' />
                                ) : null,
                            })
                        : contact.source
                          ? t.rich('created_at_via', {
                              date: formatDate(new Date(contact.createdAt)),
                              source: contact.source,
                            })
                          : t.rich('created_at_date', {
                              date: formatDate(new Date(contact.createdAt)),
                            })}
                    </span>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className='my-1 text-muted-foreground outline-hidden hover:text-foreground'
                      type='button'
                    >
                      <MoreHorizontal className='size-4' />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align='end'
                    className='bg-popover text-popover-foreground'
                  >
                    <DropdownMenuItem
                      className='cursor-pointer'
                      onClick={handleEditClick}
                    >
                      <Edit2 className='mr-2 size-4' />
                      {t('edit')}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      className='cursor-pointer text-destructive'
                      onClick={handleDeleteClick}
                    >
                      <Trash2 className='mr-2 size-4' />
                      {t('delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className='flex-none border-b p-6'>
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <div className='space-y-1.5'>
                  <div className='flex items-center justify-between text-muted-foreground text-xs'>
                    {t('last_contact')}
                    {lastContactDate && (
                      <button
                        className='text-muted-foreground hover:text-foreground'
                        onClick={() => {
                          setLastContactDate(null);
                          updateContact.mutate({
                            id: contactId[0],
                            lastContactedAt: null,
                          });
                        }}
                        type='button'
                      >
                        <X className='size-3' />
                      </button>
                    )}
                  </div>
                  <DateTimePicker
                    onChange={(date) => setLastContactDate(date)}
                    onClose={() => {
                      const lastContactedAt = contact?.lastContactedAt
                        ? new Date(contact.lastContactedAt).getTime()
                        : null;
                      const newTime = lastContactDate?.getTime() || null;

                      if (lastContactedAt !== newTime) {
                        updateContact.mutate({
                          id: contactId[0],
                          lastContactedAt: lastContactDate || undefined,
                        });
                      }
                    }}
                    size='sm'
                    value={lastContactDate}
                  />
                </div>
                <div className='space-y-1.5'>
                  <div className='flex items-center justify-between text-muted-foreground text-xs'>
                    {t('next_follow_up')}
                    {nextFollowUpDate && (
                      <button
                        className='text-muted-foreground hover:text-foreground'
                        onClick={() => {
                          setNextFollowUpDate(null);
                          updateContact.mutate({
                            id: contactId[0],
                            nextFollowUpAt: null,
                          });
                        }}
                        type='button'
                      >
                        <X className='size-3' />
                      </button>
                    )}
                  </div>
                  <DateTimePicker
                    onChange={(date) => setNextFollowUpDate(date)}
                    onClose={() => {
                      const currentTime = contact?.nextFollowUpAt
                        ? new Date(contact.nextFollowUpAt).getTime()
                        : null;
                      const newTime = nextFollowUpDate?.getTime() || null;

                      if (nextFollowUpDate) {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const lastContact = lastContactDate
                          ? new Date(lastContactDate)
                          : null;

                        if (nextFollowUpDate < today) {
                          setNextFollowUpDate(null);
                          toast.error(
                            t('next_follow_up_cannot_be_earlier_than_today')
                          );
                          return;
                        }

                        if (lastContact && nextFollowUpDate < lastContact) {
                          setNextFollowUpDate(null);
                          toast.error(
                            t(
                              'next_follow_up_cannot_be_earlier_than_last_contact'
                            )
                          );
                          return;
                        }
                      }

                      if (currentTime !== newTime) {
                        updateContact.mutate({
                          id: contactId[0],
                          nextFollowUpAt: nextFollowUpDate || undefined,
                        });
                      }
                    }}
                    size='sm'
                    value={nextFollowUpDate}
                  />
                </div>
                <div className='space-y-1.5'>
                  <span className='text-muted-foreground text-xs'>
                    {t('priority')}
                  </span>
                  <Select
                    onValueChange={handlePriorityChange}
                    value={contact?.priority || 'Medium'}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue>
                        <SmartColorBadge
                          color={
                            priorities?.find(
                              (p: Priority) =>
                                p.value === (contact?.priority || 'Medium')
                            )?.color || '#6b7280'
                          }
                          value={contact?.priority || 'Medium'}
                        />
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className='bg-popover text-popover-foreground'>
                      {priorities?.map((priority: Priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          <SmartColorBadge
                            color={priority.color}
                            value={priority.value}
                          />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-1.5'>
                  <span className='text-muted-foreground text-xs'>
                    {t('status')}
                  </span>
                  <Select
                    onValueChange={handleStatusChange}
                    value={contact?.status || 'Lead'}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue>
                        <SmartColorBadge
                          color={
                            statuses?.find(
                              (s: Status) =>
                                s.value === (contact?.status || 'Lead')
                            )?.color || '#6b7280'
                          }
                          value={contact?.status || 'Lead'}
                        />
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className='bg-popover text-popover-foreground'>
                      {statuses?.map((status: Status) => (
                        <SelectItem key={status.value} value={status.value}>
                          <SmartColorBadge
                            color={status.color}
                            value={status.value}
                          />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className='flex-1 overflow-y-auto'>
              <div className='border-b p-6'>
                <div className='mb-2 flex items-center justify-between'>
                  <h2 className='font-medium text-foreground'>{t('remark')}</h2>
                  <button
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
                    type='button'
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
                  <Textarea
                    className='min-h-[100px] bg-background'
                    onChange={(e) => setEditableRemark(e.target.value)}
                    placeholder={t('add_remark_about_this_contact')}
                    value={editableRemark}
                  />
                ) : (
                  <p className='whitespace-pre-wrap text-muted-foreground text-sm'>
                    {contact?.remark || t('no_remark_added')}
                  </p>
                )}
              </div>

              <div className='border-b p-6'>
                <EventSection
                  appointments={appointments || []}
                  calendarFolders={calendarFolders}
                  defaultTitle={t('meeting_with', {
                    who: me?.name || '',
                    name: contact?.name || '',
                  })}
                  onCreateAppointment={handleBookAppointment}
                  onDeleteAppointment={(id) => deleteAppointment.mutate({ id })}
                  onUpdateAppointment={(data) => updateAppointment.mutate(data)}
                />
              </div>

              <div className='p-6'>
                <h2 className='mb-4 font-medium'>{t('team_roles')}</h2>
                {!contact?.teams || contact.teams.length === 0 ? (
                  <p className='text-muted-foreground text-sm'>
                    {t('no_team_roles_found')}
                  </p>
                ) : (
                  <>
                    {contact?.leadingTeams?.map((team) => (
                      <div
                        className='mb-3 flex items-center justify-between'
                        key={team.id}
                      >
                        <Link
                          className='text-sm transition-colors duration-200 hover:text-primary hover:underline'
                          href={`/dashboard/crm/team/${team.id}`}
                        >
                          {team.name}
                        </Link>
                        <span className='text-muted-foreground text-xs'>
                          {t('team_leader')}
                        </span>
                      </div>
                    ))}
                    {contact?.subLeadingTeams?.map((team) => (
                      <div
                        className='mb-3 flex items-center justify-between'
                        key={team.id}
                      >
                        <Link
                          className='text-sm transition-colors duration-200 hover:text-primary hover:underline'
                          href={`/dashboard/crm/team/${team.id}`}
                        >
                          {team.name}
                        </Link>
                        <span className='text-muted-foreground text-xs'>
                          {t('sub_leader')}
                        </span>
                      </div>
                    ))}
                    {contact?.referralTeams?.map((team) => (
                      <div
                        className='mb-3 flex items-center justify-between'
                        key={team.id}
                      >
                        <Link
                          className='text-sm transition-colors duration-200 hover:text-primary hover:underline'
                          href={`/dashboard/crm/team/${team.id}`}
                        >
                          {team.name}
                        </Link>
                        <span className='text-muted-foreground text-xs'>
                          {t('referral')}
                        </span>
                      </div>
                    ))}
                    {contact?.teams
                      ?.filter(
                        (team) =>
                          !(
                            contact.leadingTeams?.some(
                              (lt) => lt.id === team.id
                            ) ||
                            contact.subLeadingTeams?.some(
                              (st) => st.id === team.id
                            ) ||
                            contact.referralTeams?.some(
                              (rt) => rt.id === team.id
                            )
                          )
                      )
                      .map((team) => (
                        <div
                          className='mb-3 flex items-center justify-between'
                          key={team.id}
                        >
                          <Link
                            className='text-sm hover:text-primary hover:underline'
                            href={`/dashboard/crm/team/${team.id}`}
                          >
                            {team.name}
                          </Link>
                          <span className='text-muted-foreground text-xs'>
                            {t('member')}
                          </span>
                        </div>
                      ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className='w-full lg:w-2/3'>
          <div className='h-full border-l p-3'>
            <TabSwitcher
              config={[
                {
                  label: t('activity_notes'),
                  value: (
                    <ActivitySection
                      activities={activities?.map((activity) => ({
                        id: activity.id,
                        type: activity.type,
                        subType: activity.subType || 'NOTE_ADDED',
                        description: activity.description || '',
                        initiatorType: 'user',
                        userId: activity.userId,
                        metadata: activity.metadata,
                        createdAt: activity.createdAt,
                      }))}
                      filterTypes={['NOTE_ADDED']}
                      isLoading={createContactActivity.isPending}
                      onCreateActivity={(data) => {
                        createContactActivity.mutate({
                          contactId: contactId[0],
                          type: 'ENGAGEMENT',
                          subType: 'NOTE_ADDED',
                          description: data.description,
                          initiatorType: data.initiatorType,
                          initiatorId: data.initiatorId,
                          metadata: {
                            ...(data.metadata as any),
                            attachments: data.attachments,
                          },
                        });
                      }}
                      onDeleteNote={(id) => deleteNote.mutate({ id })}
                      onReplyNote={(id, description) =>
                        replyNote.mutate({
                          id,
                          description,
                          contactId: contactId[0],
                        })
                      }
                      onUpdateNote={(id, description) =>
                        updateNote.mutate({ id, description })
                      }
                    />
                  ),
                },
                {
                  label: t('all_activities'),
                  value: (
                    <ActivitySection
                      activities={activities?.map((activity) => ({
                        id: activity.id,
                        type: activity.type,
                        subType: activity.subType || 'NOTE_ADDED',
                        description: activity.description || '',
                        initiatorType: 'user',
                        userId: activity.userId,
                        metadata: activity.metadata,
                        createdAt: activity.createdAt,
                      }))}
                      isLoading={createContactActivity.isPending}
                      onCreateActivity={(data) => {
                        createContactActivity.mutate({
                          contactId: contactId[0],
                          type: 'ENGAGEMENT',
                          subType: 'NOTE_ADDED',
                          description: data.description,
                          initiatorType: data.initiatorType,
                          initiatorId: data.initiatorId,
                          metadata: {
                            ...(data.metadata as any),
                            attachments: data.attachments,
                          },
                        });
                      }}
                      onDeleteNote={(id) => deleteNote.mutate({ id })}
                      onReplyNote={(id, description) =>
                        replyNote.mutate({
                          id,
                          description,
                          contactId: contactId[0],
                        })
                      }
                      onUpdateNote={(id, description) =>
                        updateNote.mutate({ id, description })
                      }
                    />
                  ),
                },
              ]}
            />
          </div>
        </div>
      </div>

      <Dialog onOpenChange={handleCloseEditModal} open={isEditModalOpen}>
        <DialogContent className='max-h-[90vh] max-w-xl overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>{t('edit_contact_information')}</DialogTitle>
          </DialogHeader>
          <form className='space-y-4' onSubmit={handleSubmitEdit}>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='firstName'>{t('first_name')}</Label>
                <Input
                  id='firstName'
                  onChange={(e) =>
                    setEditForm({ ...editForm, firstName: e.target.value })
                  }
                  value={editForm.firstName}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='lastName'>{t('last_name')}</Label>
                <Input
                  id='lastName'
                  onChange={(e) =>
                    setEditForm({ ...editForm, lastName: e.target.value })
                  }
                  value={editForm.lastName}
                />
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='email'>{t('email')}</Label>
              <Input
                id='email'
                onChange={(e) =>
                  setEditForm({ ...editForm, email: e.target.value })
                }
                type='email'
                value={editForm.email}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='phone'>{t('phone')}</Label>
              <PhoneInput
                id='phone'
                onChange={(value) => setEditForm({ ...editForm, phone: value })}
                value={editForm.phone}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='company'>{t('company')}</Label>
              <Combobox
                allowCustom={true}
                groupHeading={t('companies')}
                items={companies?.map((c) => c.name) || []}
                onChange={(value) => {
                  const selectedCompany = companies?.find(
                    (c) => c.name === value
                  );
                  setEditForm({
                    ...editForm,
                    company: selectedCompany ? selectedCompany.name : value,
                    companyId: selectedCompany?.id || null,
                  });
                }}
                placeholder={t('select_company')}
                searchPlaceholder={t('search_company')}
                value={editForm.company}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='status'>{t('status')}</Label>

              <Select
                onValueChange={(value) =>
                  setEditForm({ ...editForm, status: value })
                }
                value={editForm.status}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select status' />
                </SelectTrigger>
                <SelectContent>
                  {statuses?.map((status: Status) => (
                    <SelectItem key={status.value} value={status.value}>
                      <SmartColorBadge
                        color={status.color}
                        value={status.value}
                      />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='source'>{t('source')}</Label>
              <Combobox
                groupHeading={t('sources')}
                items={sources}
                onChange={(value) =>
                  setEditForm({ ...editForm, source: value })
                }
                placeholder={t('select_source')}
                searchPlaceholder={t('search_source')}
                value={editForm.source}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='priority'>{t('priority')}</Label>
              <Select
                onValueChange={(value) =>
                  setEditForm({ ...editForm, priority: value })
                }
                value={editForm.priority}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select priority' />
                </SelectTrigger>
                <SelectContent>
                  {priorities?.map((priority: Priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      <SmartColorBadge
                        color={priority.color}
                        value={priority.value}
                      />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='flex justify-end space-x-2'>
              <Button
                onClick={handleCloseEditModal}
                type='button'
                variant='outline'
              >
                {t('cancel')}
              </Button>
              <Button disabled={updateContact.isPending} type='submit'>
                {updateContact.isPending ? t('saving') : t('save_changes')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <EventDialog
        defaultValues={
          editingAppointment
            ? {
                title: editingAppointment.title,
                description: editingAppointment.description,
                startAt: new Date(editingAppointment.startAt),
                endAt: new Date(
                  editingAppointment.startAt.getTime() + 30 * 60_000
                ),
              }
            : undefined
        }
        folders={calendarFolders}
        isEditMode={true}
        key={editingAppointment?.id}
        onOpenChange={(open) => !open && setEditingAppointment(null)}
        onSubmit={handleEditAppointment}
        open={!!editingAppointment}
      />

      <EventDialog
        defaultValues={{
          title: t('meeting_with', {
            who: me?.name || '',
            name: contact?.name || '',
          }),
          startAt: new Date(),
          endAt: new Date(Date.now() + 30 * 60_000),
          folderId: 'default',
        }}
        folders={calendarFolders}
        onOpenChange={setIsBookingModalOpen}
        onSubmit={handleBookAppointment}
        open={isBookingModalOpen}
      />

      <Dialog onOpenChange={setIsTeamModalOpen} open={isTeamModalOpen}>
        <DialogContent className='max-h-[90vh] max-w-xl overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>{t('assign_to_team')}</DialogTitle>
          </DialogHeader>

          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label>{t('select_team')}</Label>
              <Select onValueChange={setSelectedTeam} value={selectedTeam}>
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
              <Button
                disabled={assignToTeam.isPending || !selectedTeam}
                onClick={handleAssignTeam}
              >
                {t('assign')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ActionAlertDialog
        cancelText={t('cancel')}
        confirmText={t('delete')}
        description={t('delete_contact_description')}
        onConfirm={handleDeleteConfirm}
        onOpenChange={setDeleteDialogOpen}
        open={deleteDialogOpen}
        title={t('delete_contact')}
      />
    </div>
  );
}
