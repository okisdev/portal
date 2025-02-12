'use client';

import { ActionAlertDialog } from '@/components/shared/action-alert-dialog';
import { ActivitySection } from '@/components/shared/activity-section';
import { ColorBadge } from '@/components/shared/color-badge';
import { Combobox } from '@/components/shared/combobox';
import { ComboboxCommand } from '@/components/shared/combobox';
import { EventDialog } from '@/components/shared/event-dialog';
import { EventSection } from '@/components/shared/event-section';
import { PageHeader } from '@/components/shared/page-header';
import { PageLoading } from '@/components/shared/page-loading';
import { PaginationTable } from '@/components/shared/pagination-table';
import { TabSwitcher } from '@/components/shared/tab-switcher';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { formatDate } from '@/utils/date';
import { api } from '@/utils/trpc/client';
import { CaretSortIcon } from '@radix-ui/react-icons';
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Calendar, Edit2, Eye, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { notFound, useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

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
    campaignCode: '',
    remarks: '',
    company: { id: '', name: '' },
  });
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
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
  const { data: contacts } = api.contact.getAllContacts.useQuery(undefined, {
    enabled: isAddMemberOpen,
  });
  const { data: folders } = api.calendar.getMyFolders.useQuery();
  const { data: participantOptions } = api.calendar.getParticipantOptions.useQuery(undefined, {
    enabled: isNewMeetingModalOpen,
  });
  const { data: teamActivities } = api.team.getTeamActivities.useQuery({
    id: teamId[0],
  });
  const { data: campaigns } = api.marketing.getActiveCampaigns.useQuery();
  const { data: companies } = api.company.getAllCompanies.useQuery();

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
      setIsAddMemberOpen(false);
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
        campaignCode: team.campaignCode || '',
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
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label='Select all'
        />
      ),
      cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label='Select row' />,
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          {t('name')} {column.getIsSorted() && <CaretSortIcon className='ml-2 inline' />}
        </Button>
      ),
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <Avatar className='size-8'>
            <AvatarFallback>{row.original.contact.firstName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className='font-medium'>
              {row.original.contact.firstName} {row.original.contact.lastName}
            </p>
            <p className='text-muted-foreground text-sm'>{row.original.contact.email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: ({ column }) => (
        <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          {t('role')} {column.getIsSorted() && <CaretSortIcon className='ml-2 inline' />}
        </Button>
      ),
      cell: ({ row }) => {
        const isLeader = team?.leaderId === row.original.contact.id;
        const isSubLeader = team?.subLeaderId === row.original.contact.id;
        return <div>{isLeader ? <ColorBadge type='status' value='leader' /> : isSubLeader ? <ColorBadge type='status' value='sub-leader' /> : <ColorBadge type='status' value='member' />}</div>;
      },
    },
    {
      accessorKey: 'phone',
      header: ({ column }) => (
        <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          {t('phone')} {column.getIsSorted() && <CaretSortIcon className='ml-2 inline' />}
        </Button>
      ),
      cell: ({ row }) => row.original.contact.phone || '-',
    },
    {
      accessorKey: 'company',
      header: ({ column }) => (
        <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          {t('company')} {column.getIsSorted() && <CaretSortIcon className='ml-2 inline' />}
        </Button>
      ),
      cell: ({ row }) => row.original.contact.company || '-',
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          {t('status')} {column.getIsSorted() && <CaretSortIcon className='ml-2 inline' />}
        </Button>
      ),
      cell: ({ row }) => <ColorBadge type='contactStatus' value={row.original.contact.status} />,
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className='flex justify-end'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant='ghost' className='h-8 w-8 p-0'>
                <span className='sr-only'>{t('open_menu')}</span>
                <MoreHorizontal className='size-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem
                className='cursor-pointer'
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/dashboard/crm/contacts/${row.original.contact.id}`);
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
    },
  ];

  const table = useReactTable({
    data: teamContacts || [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    initialState: {
      pagination: {
        pageSize: 8,
      },
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  if (isLoading) return <PageLoading />;

  if (!team) return notFound();

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
    <div className='space-y-4 p-4'>
      <PageHeader
        title={team.name}
        description={team.description || ''}
        right={
          <div className='flex items-center gap-2'>
            <Button variant='outline' size='sm' className='h-8' onClick={() => setIsNewMeetingModalOpen(true)}>
              <Calendar className='mr-1 size-4' /> {t('add_meeting')}
            </Button>
            <Button variant='outline' size='sm' className='h-8' onClick={handleEditClick}>
              <Edit2 className='mr-1 size-4' /> {t('edit_team')}
            </Button>
          </div>
        }
      />

      <div className='grid grid-cols-3 gap-4'>
        <div className='col-span-2 space-y-4'>
          <div className='space-y-2 rounded-lg border bg-card p-4'>
            <div className='flex items-center justify-between'>
              <p className='font-medium'>{t('team_members')}</p>
              <Popover open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                <PopoverTrigger asChild>
                  <Button variant='outline' size='sm' className='h-8'>
                    <Plus className='mr-1 size-4' /> {t('add_contact')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-[300px] p-0' align='end'>
                  <ComboboxCommand
                    query={searchValue}
                    setQuery={setSearchValue}
                    value=''
                    onChange={handleAddMember}
                    setOpen={setIsAddMemberOpen}
                    items={
                      contacts
                        ?.filter(
                          (contact) =>
                            !teamContacts?.some((c) => c.contact.id === contact.id) &&
                            (contact.firstName.toLowerCase().includes(searchValue.toLowerCase()) ||
                              contact.lastName.toLowerCase().includes(searchValue.toLowerCase()) ||
                              contact.email.toLowerCase().includes(searchValue.toLowerCase()))
                        )
                        .map((contact) => contact.id) ?? []
                    }
                    searchPlaceholder={t('search_contacts')}
                    emptyText='No contacts found.'
                    groupHeading='Contacts'
                    allowCustom={false}
                    renderItem={(contactId) => {
                      const contact = contacts?.find((c) => c.id === contactId);
                      if (!contact) return null;
                      return (
                        <>
                          <Avatar className='size-6'>
                            <AvatarFallback>{contact.firstName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className='flex-1'>
                            <p className='text-sm'>
                              {contact.firstName} {contact.lastName}
                            </p>
                            <p className='text-muted-foreground text-xs'>{contact.email}</p>
                          </div>
                        </>
                      );
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            {teamContacts && teamContacts.length === 0 && <p className='text-muted-foreground text-sm'>{t('no_team_contacts_found')}</p>}
            {teamContacts && teamContacts?.length > 0 && (
              <PaginationTable
                table={table}
                columns={columns}
                loading={isLoading}
                onRowClick={(row) => router.push(`/dashboard/crm/contacts/${row.contact.id}`)}
                rowClassName='cursor-pointer hover:bg-muted/50'
              />
            )}
          </div>

          <div className='rounded-lg border bg-card p-4'>
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
                      onCreateActivity={(data) => {
                        createTeamActivity.mutate({
                          teamId: teamId[0],
                          type: 'ENGAGEMENT',
                          subType: 'NOTE_ADDED',
                          description: data.description,
                          initiatorType: data.initiatorType,
                          initiatorId: data.initiatorId,
                          metadata: data.metadata as any,
                        });
                      }}
                      isLoading={createTeamActivity.isPending}
                    />
                  ),
                },
              ]}
            />
          </div>
        </div>

        <div className='space-y-4'>
          <div className='rounded-lg border bg-card p-4'>
            <h2 className='mb-3 font-medium'>{t('team_information')}</h2>
            <div className='space-y-1'>
              <div>
                <Label className='text-muted-foreground text-xs'>{t('team_leader')}</Label>
                <p className='text-sm'>
                  <Link href={team.leaderId ? `/dashboard/crm/contacts/${team.leaderId}` : ''}>{team.leaderId ? `${team.leader?.firstName} ${team.leader?.lastName}` : 'N/A'}</Link>
                </p>
              </div>
              <div>
                <Label className='text-muted-foreground text-xs'>{t('sub_leader')}</Label>
                <p className='text-sm'>
                  <Link href={team.subLeaderId ? `/dashboard/crm/contacts/${team.subLeaderId}` : ''}>{team.subLeaderId ? `${team.subLeader?.firstName} ${team.subLeader?.lastName}` : 'N/A'}</Link>
                </p>
              </div>
              <div>
                <Label className='text-muted-foreground text-xs'>{t('referral')}</Label>
                <p className='text-sm'>
                  <Link href={team.referralId ? `/dashboard/crm/contacts/${team.referralId}` : ''}>{team.referralId ? `${team.referral?.firstName} ${team.referral?.lastName}` : 'N/A'}</Link>
                </p>
              </div>
              <div>
                <Label className='text-muted-foreground text-xs'>{t('company')}</Label>
                <p className='text-sm'>
                  <Link href={team.company ? `/dashboard/crm/company/${team.company?.id}` : ''}>{team.company?.name || 'N/A'}</Link>
                </p>
              </div>
              <div>
                <Label className='text-muted-foreground text-xs'>{t('campaign_code')}</Label>
                <p className='text-sm'>{team.campaignCode || 'N/A'}</p>
              </div>
              <div>
                <Label className='text-muted-foreground text-xs'>{t('remarks')}</Label>
                <p className='text-sm'>{team.remarks || t('no_remark_added')}</p>
              </div>
              <div className='items-cen flex justify-end'>
                <p className='text-muted-foreground text-xs'>{t('created_on', { date: formatDate(new Date(team.createdAt)) })}</p>
              </div>
            </div>
          </div>

          <div className='rounded-lg border bg-card p-4'>
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
              onCreateAppointment={handleCreateMeeting}
              onUpdateAppointment={(data) => {
                // TODO: Add update meeting functionality
                toast.error('Update meeting functionality not implemented yet');
              }}
              onDeleteAppointment={(id) => {
                deleteTeamMeeting.mutate({
                  id,
                  teamId: teamId[0],
                });
              }}
              defaultTitle={t('team_meeting_title', { name: team.name })}
            />
          </div>
        </div>
      </div>

      <Dialog open={isEditModalOpen} onOpenChange={(open) => !open && handleCloseEdit()}>
        <DialogContent className='max-h-[90vh] max-w-xl overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>{t('edit_team_information')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit} className='space-y-4'>
            <div className='space-y-2'>
              <Label>{t('team_name')}</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className='space-y-2'>
              <Label>{t('description')}</Label>
              <Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
            </div>
            <div className='space-y-2'>
              <Label>{t('team_leader')}</Label>
              <Combobox
                value={
                  editForm.leaderId
                    ? `${teamContacts?.find((m) => m.contact.id === editForm.leaderId)?.contact.firstName} ${teamContacts?.find((m) => m.contact.id === editForm.leaderId)?.contact.lastName}`
                    : ''
                }
                onChange={(value) => {
                  const contact = teamContacts?.find((c) => `${c.contact.firstName} ${c.contact.lastName}` === value);
                  setEditForm({ ...editForm, leaderId: contact?.contact.id || '' });
                }}
                items={teamContacts?.map((c) => `${c.contact.firstName} ${c.contact.lastName}`) || []}
                placeholder={t('select_team_leader')}
                searchPlaceholder={t('search_team_leader')}
                allowCustom={false}
                groupHeading={t('contacts')}
              />
            </div>
            <div className='space-y-2'>
              <Label>{t('sub_leader')}</Label>
              <Combobox
                value={
                  editForm.subLeaderId
                    ? `${teamContacts?.find((m) => m.contact.id === editForm.subLeaderId)?.contact.firstName} ${teamContacts?.find((m) => m.contact.id === editForm.subLeaderId)?.contact.lastName}`
                    : ''
                }
                onChange={(value) => {
                  const contact = teamContacts?.find((c) => `${c.contact.firstName} ${c.contact.lastName}` === value);
                  setEditForm({ ...editForm, subLeaderId: contact?.contact.id || '' });
                }}
                items={teamContacts?.map((c) => `${c.contact.firstName} ${c.contact.lastName}`) || []}
                placeholder={t('select_sub_leader')}
                searchPlaceholder={t('search_sub_leader')}
                allowCustom={false}
                groupHeading={t('contacts')}
              />
            </div>
            <div className='space-y-2'>
              <Label>{t('referral')}</Label>
              <Combobox
                value={
                  editForm.referralId
                    ? `${contacts?.find((c) => c.id === editForm.referralId)?.firstName} ${contacts?.find((c) => c.id === editForm.referralId)?.lastName} (${
                        contacts?.find((c) => c.id === editForm.referralId)?.email
                      })`
                    : ''
                }
                onChange={(value) => {
                  const contact = contacts?.find((c) => `${c.firstName} ${c.lastName} (${c.email})` === value);
                  setEditForm({ ...editForm, referralId: contact?.id || '' });
                }}
                items={contacts?.map((contact) => `${contact.firstName} ${contact.lastName} (${contact.email})`) || []}
                placeholder={t('select_referral')}
                searchPlaceholder={t('search_referral')}
                allowCustom={false}
                groupHeading={t('contacts')}
              />
            </div>
            <div className='space-y-2'>
              <Label>{t('campaign_code')}</Label>
              <Combobox
                value={editForm.campaignCode}
                onChange={(value) => setEditForm({ ...editForm, campaignCode: value })}
                items={campaigns?.map((campaign) => campaign.campaignCode || '') || []}
                placeholder={t('select_campaign_code')}
                searchPlaceholder={t('search_campaign_code')}
                allowCustom={false}
                groupHeading={t('campaigns')}
                renderItem={(campaignCode) => {
                  const campaign = campaigns?.find((c) => c.campaignCode === campaignCode);
                  return campaign ? `${campaign.name} (${campaign.campaignCode})` : null;
                }}
              />
            </div>
            <div className='space-y-2'>
              <Label>{t('company')}</Label>
              <Combobox
                value={editForm.company ? companies?.find((c) => c.id === editForm.company.id)?.name || '' : ''}
                onChange={(value) => {
                  const company = companies?.find((c) => c.name === value);
                  setEditForm({ ...editForm, company: company || { id: '', name: '' } });
                }}
                items={companies?.map((company) => company.name) || []}
                placeholder={t('select_company')}
                searchPlaceholder={t('search_company')}
                allowCustom={false}
                groupHeading={t('companies')}
              />
            </div>
            <div className='space-y-2'>
              <Label>{t('remarks')}</Label>
              <Textarea value={editForm.remarks} onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })} placeholder={t('enter_remarks')} />
            </div>
            <div className='flex justify-end space-x-2'>
              <Button type='button' variant='outline' onClick={() => setIsEditModalOpen(false)}>
                {t('cancel')}
              </Button>
              <Button type='submit' disabled={updateTeam.isPending}>
                {updateTeam.isPending ? t('saving_loading') : t('save_changes')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <EventDialog
        open={isNewMeetingModalOpen}
        onOpenChange={setIsNewMeetingModalOpen}
        onSubmit={handleCreateMeeting}
        folders={folders}
        participantOptions={
          participantOptions && {
            users: participantOptions.users.map((u) => ({ id: u.id, name: u.name || '' })),
            contacts: participantOptions.contacts,
          }
        }
        onCreateFolder={async (name) => {
          await createFolder.mutateAsync({
            name,
            color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
          });
        }}
      />

      <ActionAlertDialog
        open={!!meetingToDelete}
        onOpenChange={(open) => !open && setMeetingToDelete(null)}
        onConfirm={() => {
          if (meetingToDelete) {
            deleteTeamMeeting.mutate({
              id: meetingToDelete,
              teamId: teamId[0],
            });
            setMeetingToDelete(null);
          }
        }}
        title={t('delete_meeting')}
        description={t('delete_meeting_description')}
      />

      <ActionAlertDialog
        open={!!contactToDelete}
        onOpenChange={(open) => !open && setContactToDelete(null)}
        onConfirm={handleDeleteContact}
        title={t('remove_contact')}
        description={t('remove_contact_description')}
      />
    </div>
  );
}
