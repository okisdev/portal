'use client';

import { ActionAlertDialog } from '@/components/shared/action-alert-dialog';
import { ColorBadge } from '@/components/shared/color-badge';
import { Combobox } from '@/components/shared/combobox';
import { ComboboxCommand } from '@/components/shared/combobox';
import { EventDialog } from '@/components/shared/event-dialog';
import { PageHeader } from '@/components/shared/page-header';
import { PageLoading } from '@/components/shared/page-loading';
import { PaginationTable } from '@/components/shared/pagination-table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { formatDate } from '@/lib/utils';
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
import { Calendar, Edit2, Plus, Trash2 } from 'lucide-react';
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
  const [newRemark, setNewRemark] = useState('');
  const [isNewMeetingModalOpen, setIsNewMeetingModalOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<string | null>(null);
  const [meetingToDelete, setMeetingToDelete] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    leaderId: '',
    subLeaderId: '',
    referralId: '',
    campaignCode: '',
    remarks: '',
  });
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const { data: team, isLoading } = api.team.getTeamById.useQuery({
    id: teamId[0],
  });
  const { data: teamContacts } = api.team.getTeamContacts.useQuery({
    teamId: teamId[0],
  });
  const { data: teamMeetings } = api.team.getTeamMeetings.useQuery({
    teamId: teamId[0],
  });
  const { data: contacts } = api.contact.getAllContacts.useQuery();
  const { data: folders } = api.calendar.getMyFolders.useQuery();
  const { data: participantOptions } = api.calendar.getParticipantOptions.useQuery();
  const { data: teamActivities } = api.team.getTeamActivities.useQuery({
    teamId: teamId[0],
  });
  const { data: campaigns } = api.marketing.getActiveCampaigns.useQuery();

  const updateTeam = api.team.updateTeam.useMutation({
    onSuccess: () => {
      router.push(`/dashboard/crm/team/${teamId[0]}`);
      utils.team.getTeamById.invalidate({ id: teamId[0] });
      toast.success('Team updated successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const createTeamActivity = api.team.createTeamActivity.useMutation({
    onSuccess: () => {
      utils.team.getTeamActivities.invalidate({ teamId: teamId[0] });
      toast.success('Activity created successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const createMeeting = api.team.createTeamMeeting.useMutation({
    onSuccess: () => {
      setIsNewMeetingModalOpen(false);
      utils.team.getTeamMeetings.invalidate({ teamId: teamId[0] });
      toast.success('Meeting created successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteTeamMeeting = api.team.deleteTeamMeeting.useMutation({
    onSuccess: () => {
      utils.team.getTeamMeetings.invalidate({ teamId: teamId[0] });
      toast.success('Meeting deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const createFolder = api.calendar.createFolder.useMutation({
    onSuccess: () => {
      utils.calendar.getMyFolders.invalidate();
      toast.success('Folder created successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const addTeamMember = api.team.addTeamMember.useMutation({
    onSuccess: () => {
      setIsAddMemberOpen(false);
      utils.team.getTeamContacts.invalidate({ teamId: teamId[0] });
      toast.success('Member added successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteTeamActivity = api.team.deleteTeamActivity.useMutation({
    onSuccess: () => {
      utils.team.getTeamActivities.invalidate({ teamId: teamId[0] });
      toast.success('Activity deleted successfully');
    },
    onError: (error: any) => {
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
          Name {column.getIsSorted() && <CaretSortIcon className='ml-2 inline' />}
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
          Role {column.getIsSorted() && <CaretSortIcon className='ml-2 inline' />}
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
          Phone {column.getIsSorted() && <CaretSortIcon className='ml-2 inline' />}
        </Button>
      ),
      cell: ({ row }) => row.original.contact.phone || '-',
    },
    {
      accessorKey: 'company',
      header: ({ column }) => (
        <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Company {column.getIsSorted() && <CaretSortIcon className='ml-2 inline' />}
        </Button>
      ),
      cell: ({ row }) => row.original.contact.company || '-',
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Status {column.getIsSorted() && <CaretSortIcon className='ml-2 inline' />}
        </Button>
      ),
      cell: ({ row }) => <ColorBadge type='contactStatus' value={row.original.contact.status} />,
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
        pageSize: 13,
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
    addTeamMember.mutate({
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

  const handleSubmitActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRemark.trim()) return;

    createTeamActivity.mutate({
      teamId: teamId[0],
      type: 'note',
      title: 'Note',
      description: newRemark,
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

  const initialParticipants =
    teamContacts?.map((c) => ({
      type: 'contact' as const,
      id: c.contact.id,
      name: `${c.contact.firstName} ${c.contact.lastName}`,
      role: 'required' as const,
    })) || [];

  return (
    <div className='space-y-4 p-4'>
      <PageHeader
        title={team.name}
        description={team.description || ''}
        right={
          <div className='flex items-center gap-2'>
            <Button variant='outline' size='sm' className='h-8' onClick={() => setIsNewMeetingModalOpen(true)}>
              <Calendar className='mr-1 size-4' /> New Meeting
            </Button>
            <Button variant='outline' size='sm' className='h-8' onClick={handleEditClick}>
              <Edit2 className='mr-1 size-4' /> Edit Team
            </Button>
          </div>
        }
      />

      <div className='grid grid-cols-3 gap-4'>
        <div className='col-span-2 space-y-4'>
          <div className='space-y-2 rounded-lg border bg-card p-4'>
            <div className='flex items-center justify-between'>
              <p className='font-medium'>Team Members</p>
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
                    searchPlaceholder='Search contacts...'
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
            <div className='mb-4 flex items-center justify-between'>
              <h2 className='font-medium'>Activities</h2>
              <form onSubmit={handleSubmitActivity} className='flex max-w-md flex-1 gap-2'>
                <Input value={newRemark} onChange={(e) => setNewRemark(e.target.value)} placeholder='Add activity...' className='h-8' />
                <Button type='submit' size='sm' disabled={createTeamActivity.isPending}>
                  Add
                </Button>
              </form>
            </div>
            <div className='space-y-3'>
              {teamActivities?.map((activity) => (
                <div key={activity.id} className='flex items-start justify-between rounded-lg border bg-card p-3'>
                  <div className='space-y-1'>
                    <div className='flex items-center gap-2'>
                      <p className='font-medium text-sm'>{activity.title}</p>
                      <ColorBadge type='status' value={activity.type} />
                    </div>
                    <p className='text-sm'>{activity.description}</p>
                    <p className='text-muted-foreground text-xs'>{formatDate(new Date(activity.createdAt))}</p>
                  </div>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => {
                      setActivityToDelete(activity.id);
                    }}
                  >
                    <Trash2 className='size-4 text-muted-foreground' />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className='space-y-4'>
          <div className='rounded-lg border bg-card p-4'>
            <h2 className='mb-3 font-medium'>Team Information</h2>
            <div className='space-y-1'>
              <div>
                <Label className='text-muted-foreground text-xs'>Team Leader</Label>
                <p className='text-sm'>
                  <Link href={`/dashboard/crm/contacts/${team.leaderId}`}>{team.leaderId ? `${team.leader?.firstName} ${team.leader?.lastName}` : 'N/A'}</Link>
                </p>
              </div>
              <div>
                <Label className='text-muted-foreground text-xs'>Sub Leader</Label>
                <p className='text-sm'>
                  <Link href={`/dashboard/crm/contacts/${team.subLeaderId}`}>{team.subLeaderId ? `${team.subLeader?.firstName} ${team.subLeader?.lastName}` : 'N/A'}</Link>
                </p>
              </div>
              <div>
                <Label className='text-muted-foreground text-xs'>Referral</Label>
                <p className='text-sm'>
                  <Link href={`/dashboard/crm/contacts/${team.referralId}`}>{team.referralId ? `${team.referral?.firstName} ${team.referral?.lastName}` : 'N/A'}</Link>
                </p>
              </div>
              <div>
                <Label className='text-muted-foreground text-xs'>Campaign Code</Label>
                <p className='text-sm'>{team.campaignCode || 'N/A'}</p>
              </div>
              <div>
                <Label className='text-muted-foreground text-xs'>Remarks</Label>
                <p className='text-sm'>{team.remarks || 'No remarks available'}</p>
              </div>
              <div className='items-cen flex justify-end'>
                <p className='text-muted-foreground text-xs'>Created on {formatDate(new Date(team.createdAt))}</p>
              </div>
            </div>
          </div>

          <div className='space-y-3 rounded-lg border bg-card p-4'>
            <h2 className='font-medium'>Meetings</h2>
            <div className='space-y-3'>
              {teamMeetings?.map((meeting) => (
                <div key={meeting.id} className='flex items-center gap-3 text-sm'>
                  <Calendar className='size-4 text-muted-foreground' />
                  <div className='flex-1'>
                    <p className='font-medium'>{meeting.title}</p>
                    <p className='text-muted-foreground text-xs'>
                      {formatDate(new Date(meeting.meetingDate))}
                      {meeting.status === 'completed' && ' (Past)'}
                    </p>
                  </div>
                  <ColorBadge type='status' value={meeting.status || 'upcoming'} />
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => {
                      setMeetingToDelete(meeting.id);
                    }}
                  >
                    <Trash2 className='size-4 text-muted-foreground' />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isEditModalOpen} onOpenChange={(open) => !open && handleCloseEdit()}>
        <DialogContent className='max-h-[90vh] max-w-xl overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Edit Team Information</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit} className='space-y-4'>
            <div className='space-y-2'>
              <Label>Team Name</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className='space-y-2'>
              <Label>Description</Label>
              <Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
            </div>
            <div className='space-y-2'>
              <Label>Team Leader</Label>
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
                placeholder='Select team leader'
                searchPlaceholder='Search team leader...'
                allowCustom={false}
                groupHeading='Contacts'
              />
            </div>
            <div className='space-y-2'>
              <Label>Sub Leader</Label>
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
                placeholder='Select sub leader'
                searchPlaceholder='Search sub leader...'
                allowCustom={false}
                groupHeading='Contacts'
              />
            </div>
            <div className='space-y-2'>
              <Label>Referral</Label>
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
                placeholder='Select referral'
                searchPlaceholder='Search referral...'
                allowCustom={false}
                groupHeading='Contacts'
              />
            </div>
            <div className='space-y-2'>
              <Label>Campaign Code</Label>
              <Combobox
                value={editForm.campaignCode}
                onChange={(value) => setEditForm({ ...editForm, campaignCode: value })}
                items={campaigns?.map((campaign) => campaign.campaignCode || '') || []}
                placeholder='Select campaign code'
                searchPlaceholder='Search campaign code...'
                allowCustom={false}
                groupHeading='Campaigns'
                renderItem={(campaignCode) => {
                  const campaign = campaigns?.find((c) => c.campaignCode === campaignCode);
                  return campaign ? `${campaign.name} (${campaign.campaignCode})` : null;
                }}
              />
            </div>
            <div className='space-y-2'>
              <Label>Remarks</Label>
              <Textarea value={editForm.remarks} onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })} placeholder='Enter team remarks' />
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
        initialParticipants={initialParticipants}
        onCreateFolder={async (name) => {
          await createFolder.mutateAsync({
            name,
            color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
          });
        }}
      />

      <ActionAlertDialog
        open={!!activityToDelete}
        onOpenChange={(open) => !open && setActivityToDelete(null)}
        onConfirm={() => {
          if (activityToDelete) {
            deleteTeamActivity.mutate({
              id: activityToDelete,
              teamId: teamId[0],
            });
            setActivityToDelete(null);
          }
        }}
        title='Delete Activity'
        description='Are you sure you want to delete this activity? This action cannot be undone.'
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
        title='Delete Meeting'
        description='Are you sure you want to delete this meeting? This action cannot be undone.'
      />
    </div>
  );
}
