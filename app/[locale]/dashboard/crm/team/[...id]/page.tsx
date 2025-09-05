'use client';

import {
  type ColumnDef,
  type ColumnFiltersState,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table';
import { Calendar, Edit2, Eye, MoreHorizontal, Trash2 } from 'lucide-react';
import Link from 'next/link';
import {
  notFound,
  useParams,
  useRouter,
  useSearchParams,
} from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ActionAlertDialog } from '@/components/shared/action-alert-dialog';
import { ActivitySection } from '@/components/shared/activity-section';
import { ColorBadge } from '@/components/shared/color-badge';
import { Combobox } from '@/components/shared/combobox';
import { EventDialog } from '@/components/shared/event-dialog';
import { EventSection } from '@/components/shared/event-section';
import { PageLoading } from '@/components/shared/page-loading';
import { SmartColorBadge } from '@/components/shared/smart-color-badge';
import { TabSwitcher } from '@/components/shared/tab-switcher';
import { DataTable } from '@/components/shared/table';
import { DataTableHeader } from '@/components/shared/table/header';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import type { Status } from '@/lib/schema';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/date';
import { parsePhone } from '@/utils/phone';
import { api } from '@/utils/trpc/client';

export default function TeamIdPage() {
  const { id: teamId } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const t = useTranslations();

  const utils = api.useUtils();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNewMeetingModalOpen, setIsNewMeetingModalOpen] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    leaderId: '',
    subLeaderId: '',
    referralId: '',
    remarks: '',
    company: { id: '', name: '' },
  });
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);

  const { data: team, isLoading } = api.team.getTeamById.useQuery({
    id: teamId[0],
  });
  const { data: teamContacts } = api.team.getTeamContacts.useQuery({
    teamId: teamId[0],
  });
  const { data: teamMeetings } = api.team.getTeamMeetings.useQuery({
    teamId: teamId[0],
  });
  const { data: folders } = api.calendar.getMyFolders.useQuery();
  const { data: participantOptions } =
    api.calendar.getParticipantOptions.useQuery(undefined, {
      enabled: isNewMeetingModalOpen,
    });
  const { data: teamActivities, refetch: refetchTeamActivities } =
    api.team.getTeamActivities.useQuery({
      id: teamId[0],
    });
  const { data: companies } = api.company.getAllCompanies.useQuery();
  const { data: statuses } = api.site.getStatus.useQuery();

  const replyNote = api.team.activity.replyNote.useMutation({
    onSuccess: () => {
      toast.success(t('note_replied'));
      refetchTeamActivities();
    },
  });

  const deleteNote = api.team.activity.deleteNote.useMutation({
    onSuccess: () => {
      toast.success(t('note_deleted'));
      refetchTeamActivities();
    },
  });

  const updateNote = api.team.activity.updateNote.useMutation({
    onSuccess: () => {
      toast.success(t('note_updated'));

      refetchTeamActivities();
    },
  });

  const updateTeam = api.team.updateTeam.useMutation({
    onSuccess: () => {
      router.push(`/dashboard/crm/team/${teamId[0]}`);
      utils.team.getTeamById.invalidate({ id: teamId[0] });
      toast.success(t('team_updated_successfully'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const createTeamActivity = api.team.createTeamActivity.useMutation({
    onSuccess: () => {
      utils.team.getTeamActivities.invalidate({ id: teamId[0] });
      toast.success(t('note_added_successfully'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const createMeeting = api.team.createTeamMeeting.useMutation({
    onSuccess: () => {
      setIsNewMeetingModalOpen(false);
      utils.team.getTeamMeetings.invalidate({ teamId: teamId[0] });
      toast.success(t('meeting_created_successfully'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteTeamMeeting = api.team.deleteTeamMeeting.useMutation({
    onSuccess: () => {
      utils.team.getTeamMeetings.invalidate({ teamId: teamId[0] });
      toast.success(t('meeting_deleted_successfully'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const createFolder = api.calendar.createFolder.useMutation({
    onSuccess: () => {
      utils.calendar.getMyFolders.invalidate();
      toast.success(t('folder_created_successfully'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const addTeamContact = api.team.addTeamContact.useMutation({
    onSuccess: () => {
      utils.team.getTeamContacts.invalidate({ teamId: teamId[0] });
      utils.team.getTeamActivities.invalidate({ id: teamId[0] });
      toast.success(t('contact_added_successfully'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const removeContactFromTeam = api.team.removeContactFromTeam.useMutation({
    onSuccess: () => {
      setContactToDelete(null);
      utils.team.getTeamContacts.invalidate({ teamId: teamId[0] });
      utils.team.getTeamActivities.invalidate({ id: teamId[0] });
      toast.success(t('contact_removed_successfully'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (mode === 'edit' && team) {
      setEditForm({
        name: team.name,
        description: team.description || '',
        leaderId: team.leaderId || '',
        subLeaderId: team.subLeaderId || '',
        referralId: team.referralId || '',
        remarks: team.remarks || '',
        company: team.company || { id: '', name: '' },
      });
      setIsEditModalOpen(true);
    } else {
      setIsEditModalOpen(false);
    }
  }, [mode, team]);

  const columns: ColumnDef<any>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          aria-label='Select all'
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label='Select row'
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableHeader column={column} title={t('name')} />
      ),
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <Avatar className='size-8'>
            <AvatarFallback>
              {row.original.contact.firstName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className='font-medium'>
              {row.original.contact.firstName} {row.original.contact.lastName}
            </p>
            <p className='text-muted-foreground text-sm'>
              {row.original.contact.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: ({ column }) => (
        <DataTableHeader column={column} title={t('role')} />
      ),
      cell: ({ row }) => {
        const isLeader = team?.leaderId === row.original.contact.id;
        const isSubLeader = team?.subLeaderId === row.original.contact.id;
        return (
          <div>
            {isLeader ? (
              <ColorBadge type='default' value='Leader' />
            ) : isSubLeader ? (
              <ColorBadge type='default' value='Sub Leader' />
            ) : (
              <ColorBadge type='default' value='Member' />
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'phone',
      header: ({ column }) => (
        <DataTableHeader column={column} title={t('phone')} />
      ),
      cell: ({ row }) => parsePhone(row.original.contact.phone) || '-',
    },
    {
      accessorKey: 'company',
      header: ({ column }) => (
        <DataTableHeader column={column} title={t('company')} />
      ),
      cell: ({ row }) => row.original.contact.company || '-',
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableHeader column={column} title={t('status')} />
      ),
      cell: ({ row }) => (
        <SmartColorBadge
          color={
            statuses?.find(
              (s: Status) => s.value === (row.original.contact.status || 'Lead')
            )?.color || '#6b7280'
          }
          value={row.original.contact.status}
        />
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className='flex justify-end'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button className='h-8 w-8 p-0' variant='ghost'>
                <span className='sr-only'>{t('open_menu')}</span>
                <MoreHorizontal className='size-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem
                className='cursor-pointer'
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(
                    `/dashboard/crm/contacts/${row.original.contact.id}`
                  );
                }}
              >
                <Eye className='mr-2 size-4' />
                {t('view')}
              </DropdownMenuItem>
              <DropdownMenuItem
                className='cursor-pointer text-destructive'
                onClick={(e) => {
                  e.stopPropagation();
                  setContactToDelete(row.original.contact.id);
                }}
              >
                <Trash2 className='mr-2 size-4' />
                {t('delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];

  const table = useReactTable({
    data: teamContacts ?? [],
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  if (isLoading) {
    return <PageLoading />;
  }

  if (!team) {
    return notFound();
  }

  const handleAddMember = (contactId: string) => {
    addTeamContact.mutate({
      teamId: teamId[0],
      contactId,
    });
  };

  const handleEditClick = () => {
    router.push(`/dashboard/crm/team/${teamId[0]}?mode=edit`);
  };

  const handleCloseEdit = () => {
    router.push(`/dashboard/crm/team/${teamId[0]}`);
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    updateTeam.mutate({
      id: teamId[0],
      ...editForm,
    });
  };

  const handleCreateMeeting = async (data: any) => {
    await createMeeting.mutateAsync({
      teamId: teamId[0],
      title: data.title,
      description: data.description ?? '',
      meetingDate: data.startAt,
    });
  };

  const handleDeleteContact = () => {
    if (contactToDelete) {
      removeContactFromTeam.mutate({
        teamId: teamId[0],
        contactId: contactToDelete,
      });
    }
  };

  return (
    <div className='h-full min-h-0 w-full flex-1'>
      <div className='flex h-full'>
        <div className='flex-1'>
          <div className='flex h-full flex-col border-r bg-background'>
            {/* Header Section */}
            <div className='border-b px-6 py-4'>
              <div
                className={cn(
                  team.description
                    ? 'flex items-start justify-between'
                    : 'flex items-center justify-between'
                )}
              >
                <div>
                  <h1 className='font-semibold text-xl'>{team.name}</h1>
                  {team.description && (
                    <p className='mt-1 text-muted-foreground text-sm'>
                      {team.description}
                    </p>
                  )}
                </div>
                <div className='flex items-center gap-2'>
                  <Button
                    onClick={() => setIsNewMeetingModalOpen(true)}
                    size='sm'
                    variant='outline'
                  >
                    <Calendar className='mr-2 size-4' /> {t('add_meeting')}
                  </Button>
                  <Button onClick={handleEditClick} size='sm' variant='outline'>
                    <Edit2 className='mr-2 size-4' /> {t('edit_team')}
                  </Button>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className='flex-1 overflow-y-auto'>
              {/* Team Members Section */}
              <div className='border-b px-6 py-4'>
                <div className='mb-4'>
                  <h2 className='font-medium'>{t('team_members')}</h2>
                </div>
                {teamContacts && teamContacts.length === 0 && (
                  <p className='text-muted-foreground text-sm'>
                    {t('no_team_contacts_found')}
                  </p>
                )}
                {teamContacts && teamContacts?.length > 0 && (
                  <DataTable
                    columns={columns}
                    loading={isLoading}
                    onRowClick={(row) =>
                      router.push(`/dashboard/crm/contacts/${row.contact.id}`)
                    }
                    table={table}
                  />
                )}
              </div>

              {/* Activity Section */}
              <div className='px-6 py-4'>
                <TabSwitcher
                  config={[
                    {
                      label: t('activity'),
                      value: (
                        <ActivitySection
                          activities={teamActivities?.map((activity) => ({
                            id: activity.id,
                            type: activity.type,
                            subType: activity.subType || 'NOTE_ADDED',
                            description: activity.description || '',
                            initiatorType: 'user',
                            userId: activity.userId,
                            metadata: activity.metadata,
                            createdAt: activity.createdAt,
                          }))}
                          isLoading={createTeamActivity.isPending}
                          onCreateActivity={(data) => {
                            createTeamActivity.mutate({
                              teamId: teamId[0],
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
                            replyNote.mutate({ id, description })
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
        </div>

        {/* Right Sidebar */}
        <div className='w-80'>
          <div className='h-full overflow-y-auto bg-card'>
            {/* Team Information */}
            <div className='p-3'>
              <h3 className='mb-3 font-medium text-sm'>
                {t('team_information')}
              </h3>
              <div className='space-y-3'>
                <div>
                  <Label className='text-muted-foreground text-xs uppercase tracking-wide'>
                    {t('team_leader')}
                  </Label>
                  <p className='mt-1 text-sm'>
                    <Link
                      className='hover:underline'
                      href={
                        team.leaderId
                          ? `/dashboard/crm/contacts/${team.leaderId}`
                          : ''
                      }
                    >
                      {team.leaderId
                        ? `${team.leader?.firstName} ${team.leader?.lastName}`
                        : 'N/A'}
                    </Link>
                  </p>
                </div>
                <div>
                  <Label className='text-muted-foreground text-xs uppercase tracking-wide'>
                    {t('sub_leader')}
                  </Label>
                  <p className='mt-1 text-sm'>
                    <Link
                      className='hover:underline'
                      href={
                        team.subLeaderId
                          ? `/dashboard/crm/contacts/${team.subLeaderId}`
                          : ''
                      }
                    >
                      {team.subLeaderId
                        ? `${team.subLeader?.firstName} ${team.subLeader?.lastName}`
                        : 'N/A'}
                    </Link>
                  </p>
                </div>
                <div>
                  <Label className='text-muted-foreground text-xs uppercase tracking-wide'>
                    {t('referral')}
                  </Label>
                  <p className='mt-1 text-sm'>
                    <Link
                      className='hover:underline'
                      href={
                        team.referralId
                          ? `/dashboard/crm/contacts/${team.referralId}`
                          : ''
                      }
                    >
                      {team.referralId
                        ? `${team.referral?.firstName} ${team.referral?.lastName}`
                        : 'N/A'}
                    </Link>
                  </p>
                </div>
                <div>
                  <Label className='text-muted-foreground text-xs uppercase tracking-wide'>
                    {t('company')}
                  </Label>
                  <p className='mt-1 text-sm'>
                    <Link
                      className='hover:underline'
                      href={
                        team.company
                          ? `/dashboard/crm/company/${team.company?.id}`
                          : ''
                      }
                    >
                      {team.company?.name || 'N/A'}
                    </Link>
                  </p>
                </div>
                <div>
                  <Label className='text-muted-foreground text-xs uppercase tracking-wide'>
                    {t('remarks')}
                  </Label>
                  <p className='mt-1 text-sm'>
                    {team.remarks || t('no_remark_added')}
                  </p>
                </div>
                <div>
                  <p className='text-right text-muted-foreground text-xs'>
                    {t('created_on', {
                      date: formatDate(new Date(team.createdAt)),
                    })}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Team Meetings */}
            <div className='p-3'>
              <h3 className='mb-3 font-medium text-sm'>{t('team_meetings')}</h3>
              <EventSection
                appointments={
                  teamMeetings?.map((meeting) => ({
                    id: meeting.id,
                    title: meeting.title,
                    description: meeting.description,
                    startAt: new Date(meeting.meetingDate),
                    endAt: new Date(meeting.meetingDate),
                  })) || []
                }
                calendarFolders={folders}
                defaultTitle={t('team_meeting_title', { name: team.name })}
                onCreateAppointment={handleCreateMeeting}
                onDeleteAppointment={(id) => {
                  deleteTeamMeeting.mutate({
                    id,
                    teamId: teamId[0],
                  });
                }}
                onUpdateAppointment={(_data) => {
                  // TODO: Add update meeting functionality
                  toast.error(
                    'Update meeting functionality not implemented yet'
                  );
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <Dialog
        onOpenChange={(open) => !open && handleCloseEdit()}
        open={isEditModalOpen}
      >
        <DialogContent className='max-h-[90vh] max-w-xl overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>{t('edit_team_information')}</DialogTitle>
          </DialogHeader>
          <form className='space-y-4' onSubmit={handleSubmitEdit}>
            <div className='space-y-2'>
              <Label>{t('team_name')}</Label>
              <Input
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                value={editForm.name}
              />
            </div>
            <div className='space-y-2'>
              <Label>{t('description')}</Label>
              <Textarea
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                value={editForm.description}
              />
            </div>
            <div className='space-y-2'>
              <Label>{t('team_leader')}</Label>
              <Combobox
                allowCustom={false}
                groupHeading={t('contacts')}
                items={
                  teamContacts?.map(
                    (c) => `${c.contact.firstName} ${c.contact.lastName}`
                  ) || []
                }
                onChange={(value) => {
                  const contact = teamContacts?.find(
                    (c) =>
                      `${c.contact.firstName} ${c.contact.lastName}` === value
                  );
                  setEditForm({
                    ...editForm,
                    leaderId: contact?.contact.id || '',
                  });
                }}
                placeholder={t('select_team_leader')}
                searchPlaceholder={t('search_team_leader')}
                value={
                  editForm.leaderId
                    ? `${teamContacts?.find((m) => m.contact.id === editForm.leaderId)?.contact.firstName} ${teamContacts?.find((m) => m.contact.id === editForm.leaderId)?.contact.lastName}`
                    : ''
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>{t('sub_leader')}</Label>
              <Combobox
                allowCustom={false}
                groupHeading={t('contacts')}
                items={
                  teamContacts?.map(
                    (c) => `${c.contact.firstName} ${c.contact.lastName}`
                  ) || []
                }
                onChange={(value) => {
                  const contact = teamContacts?.find(
                    (c) =>
                      `${c.contact.firstName} ${c.contact.lastName}` === value
                  );
                  setEditForm({
                    ...editForm,
                    subLeaderId: contact?.contact.id || '',
                  });
                }}
                placeholder={t('select_sub_leader')}
                searchPlaceholder={t('search_sub_leader')}
                value={
                  editForm.subLeaderId
                    ? `${teamContacts?.find((m) => m.contact.id === editForm.subLeaderId)?.contact.firstName} ${teamContacts?.find((m) => m.contact.id === editForm.subLeaderId)?.contact.lastName}`
                    : ''
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>{t('referral')}</Label>
              <Combobox
                allowCustom={false}
                groupHeading={t('contacts')}
                items={
                  teamContacts?.map(
                    (contact) =>
                      `${contact.contact.firstName} ${contact.contact.lastName} (${contact.contact.email})`
                  ) || []
                }
                onChange={(value) => {
                  const contact = teamContacts?.find(
                    (c) =>
                      `${c.contact.firstName} ${c.contact.lastName} (${c.contact.email})` ===
                      value
                  );
                  setEditForm({ ...editForm, referralId: contact?.id || '' });
                }}
                placeholder={t('select_referral')}
                searchPlaceholder={t('search_referral')}
                value={
                  editForm.referralId
                    ? `${teamContacts?.find((c) => c.contact.id === editForm.referralId)?.contact.firstName} ${teamContacts?.find((c) => c.contact.id === editForm.referralId)?.contact.lastName} (${
                        teamContacts?.find(
                          (c) => c.contact.id === editForm.referralId
                        )?.contact.email
                      })`
                    : ''
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>{t('company')}</Label>
              <Combobox
                allowCustom={false}
                groupHeading={t('companies')}
                items={companies?.map((company) => company.name) || []}
                onChange={(value) => {
                  const company = companies?.find((c) => c.name === value);
                  setEditForm({
                    ...editForm,
                    company: company || { id: '', name: '' },
                  });
                }}
                placeholder={t('select_company')}
                searchPlaceholder={t('search_company')}
                value={
                  editForm.company
                    ? companies?.find((c) => c.id === editForm.company.id)
                        ?.name || ''
                    : ''
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>{t('remarks')}</Label>
              <Textarea
                onChange={(e) =>
                  setEditForm({ ...editForm, remarks: e.target.value })
                }
                placeholder={t('enter_remarks')}
                value={editForm.remarks}
              />
            </div>
            <div className='flex justify-end space-x-2'>
              <Button
                onClick={() => setIsEditModalOpen(false)}
                type='button'
                variant='outline'
              >
                {t('cancel')}
              </Button>
              <Button disabled={updateTeam.isPending} type='submit'>
                {updateTeam.isPending ? t('saving_loading') : t('save_changes')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <EventDialog
        folders={folders}
        onCreateFolder={async (name) => {
          await createFolder.mutateAsync({
            name,
            color: `#${Math.floor(Math.random() * 16_777_215).toString(16)}`,
          });
        }}
        onOpenChange={setIsNewMeetingModalOpen}
        onSubmit={handleCreateMeeting}
        open={isNewMeetingModalOpen}
        participantOptions={
          participantOptions && {
            users: participantOptions.users.map((u) => ({
              id: u.id,
              name: u.name || '',
            })),
            contacts: participantOptions.contacts,
          }
        }
      />

      <ActionAlertDialog
        description={t('delete_meeting_description')}
        onConfirm={() => {
          if (meetingToDelete) {
            deleteTeamMeeting.mutate({
              id: meetingToDelete,
              teamId: teamId[0],
            });
            setMeetingToDelete(null);
          }
        }}
        onOpenChange={(open) => !open && setMeetingToDelete(null)}
        open={!!meetingToDelete}
        title={t('delete_meeting')}
      />

      <ActionAlertDialog
        description={t('remove_contact_description')}
        onConfirm={handleDeleteContact}
        onOpenChange={(open) => !open && setContactToDelete(null)}
        open={!!contactToDelete}
        title={t('remove_contact')}
      />
    </div>
  );
}
