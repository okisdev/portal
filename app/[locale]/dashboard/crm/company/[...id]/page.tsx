'use client';

import { ActionAlertDialog } from '@/components/shared/action-alert-dialog';
import { ColorBadge } from '@/components/shared/color-badge';
import { ComboboxCommand } from '@/components/shared/combobox';
import { EventDialog } from '@/components/shared/event-dialog';
import { PageHeader } from '@/components/shared/page-header';
import { PageLoading } from '@/components/shared/page-loading';
import { PaginationTable } from '@/components/shared/pagination-table';
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
import { Edit2, Eye, MoreHorizontal, Plus, Trash2, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { notFound, useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function CompanyIdPage() {
  const { id: companyId } = useParams<{ id: string }>();
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
    industry: '',
    size: '',
    website: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    phone: '',
    email: '',
    status: 'active' as 'active' | 'inactive',
  });
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);

  const { data: company, isLoading } = api.company.getCompanyById.useQuery({
    id: companyId[0],
  });
  const { data: companyContacts } = api.company.getCompanyContacts.useQuery({
    companyId: companyId[0],
  });
  const { data: teams } = api.company.getCompanyTeams.useQuery({
    companyId: companyId[0],
  });
  const { data: folders } = api.calendar.getMyFolders.useQuery();
  const { data: participantOptions } = api.calendar.getParticipantOptions.useQuery(undefined, {
    enabled: isNewMeetingModalOpen,
  });

  const { data: contacts } = api.contact.getAllContacts.useQuery(undefined, {
    enabled: isAddContactOpen,
  });

  const updateCompany = api.company.updateCompany.useMutation({
    onSuccess: () => {
      router.push(`/dashboard/crm/company/${companyId[0]}`);
      utils.company.getCompanyById.invalidate({ id: companyId[0] });
      toast.success(t('company_updated_successfully'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const createMeeting = api.team.createTeamMeeting.useMutation({
    onSuccess: () => {
      setIsNewMeetingModalOpen(false);
      utils.team.getTeamMeetings.invalidate({ teamId: companyId[0] });
      toast.success('Meeting created successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteTeamMeeting = api.team.deleteTeamMeeting.useMutation({
    onSuccess: () => {
      utils.team.getTeamMeetings.invalidate({ teamId: companyId[0] });
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

  const addCompanyContact = api.company.addCompanyContact.useMutation({
    onSuccess: () => {
      setIsAddContactOpen(false);
      utils.company.getCompanyContacts.invalidate({ companyId: companyId[0] });
      toast.success(t('contact_added_successfully'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const removeCompanyContact = api.company.removeCompanyContact.useMutation({
    onSuccess: () => {
      setContactToDelete(null);
      utils.company.getCompanyContacts.invalidate({ companyId: companyId[0] });
      toast.success(t('contact_removed_successfully'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (mode === 'edit' && company) {
      setEditForm({
        name: company.name,
        description: company.description || '',
        industry: company.industry || '',
        size: company.size || '',
        website: company.website || '',
        address: company.address || '',
        city: company.city || '',
        state: company.state || '',
        country: company.country || '',
        postalCode: company.postalCode || '',
        phone: company.phone || '',
        email: company.email || '',
        status: company.status || 'active',
      });
      setIsEditModalOpen(true);
    } else {
      setIsEditModalOpen(false);
    }
  }, [mode, company]);

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
      cell: ({ row }) => {
        const contact = row.original.contact;
        return (
          <div className='flex items-center gap-2'>
            <Avatar className='size-8'>
              <AvatarFallback>{contact.firstName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className='font-medium'>
                {contact.firstName} {contact.lastName}
              </p>
              <p className='text-muted-foreground text-sm'>{contact.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'role',
      header: ({ column }) => (
        <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          {t('role')} {column.getIsSorted() && <CaretSortIcon className='ml-2 inline' />}
        </Button>
      ),
      cell: ({ row }) => <ColorBadge type='status' value={row.original.contact.role || 'employee'} />,
    },
    {
      accessorKey: 'department',
      header: ({ column }) => (
        <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          {t('department')} {column.getIsSorted() && <CaretSortIcon className='ml-2 inline' />}
        </Button>
      ),
      cell: ({ row }) => row.original.contact.department || '-',
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
    data: companyContacts || [],
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

  if (!company) return notFound();

  const handleAddContact = (contactId: string) => {
    addCompanyContact.mutate({
      companyId: companyId[0],
      contactId,
    });
  };

  const handleEditClick = () => {
    router.push(`/dashboard/crm/company/${companyId[0]}?mode=edit`);
  };

  const handleCloseEdit = () => {
    router.push(`/dashboard/crm/company/${companyId[0]}`);
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompany.mutate({
      id: companyId[0],
      ...editForm,
    });
  };

  const handleCreateMeeting = async (data: any) => {
    await createMeeting.mutateAsync({
      teamId: companyId[0],
      title: data.title,
      description: data.description ?? '',
      meetingDate: data.startAt,
    });
  };

  const handleDeleteContact = () => {
    if (contactToDelete) {
      removeCompanyContact.mutate({
        companyId: companyId[0],
        contactId: contactToDelete,
      });
    }
  };

  return (
    <div className='space-y-4 p-4'>
      <PageHeader
        title={company.name}
        description={company.description || ''}
        right={
          <div className='flex items-center gap-2'>
            <Button variant='outline' size='sm' className='h-8' onClick={handleEditClick}>
              <Edit2 className='mr-1 size-4' /> {t('edit_company')}
            </Button>
          </div>
        }
      />

      <div className='grid grid-cols-3 gap-4'>
        <div className='col-span-2 space-y-4'>
          <div className='space-y-2 rounded-lg border bg-card p-4'>
            <div className='flex items-center justify-between'>
              <p className='font-medium'>{t('company_contacts')}</p>
              <Popover open={isAddContactOpen} onOpenChange={setIsAddContactOpen}>
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
                    onChange={handleAddContact}
                    setOpen={setIsAddContactOpen}
                    items={
                      contacts
                        ?.filter(
                          (contact) =>
                            !companyContacts?.some((c) => c.contact.id === contact.id) &&
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
            {companyContacts && companyContacts?.length > 0 && (
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
            <div className='flex items-center justify-between'>
              <p className='font-medium'>{t('company_teams')}</p>
              <Button variant='outline' size='sm' className='h-8' onClick={() => router.push(`/dashboard/crm/team/new?companyId=${companyId[0]}`)}>
                <Plus className='mr-1 size-4' /> {t('add_team')}
              </Button>
            </div>
            <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
              {teams?.map((team) => (
                <Link key={team.id} href={`/dashboard/crm/team/${team.id}`} className='rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50'>
                  <div className='flex items-start justify-between'>
                    <div>
                      <p className='font-medium'>{team.name}</p>
                      <p className='text-muted-foreground text-sm'>{team.description || 'N/A'}</p>
                    </div>
                    <div className='flex items-center gap-2'>
                      <div className='flex items-center gap-1'>
                        <Users className='size-4' />
                        <span className='text-sm'>{team.contacts}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className='space-y-4'>
          <div className='rounded-lg border bg-card p-4'>
            <h2 className='mb-3 font-medium'>{t('company_information')}</h2>
            <div className='space-y-1'>
              <div>
                <Label className='text-muted-foreground text-xs'>{t('industry')}</Label>
                <p className='text-sm'>{company.industry || 'N/A'}</p>
              </div>
              <div>
                <Label className='text-muted-foreground text-xs'>{t('size')}</Label>
                <p className='text-sm'>{company.size || 'N/A'}</p>
              </div>
              <div>
                <Label className='text-muted-foreground text-xs'>{t('website')}</Label>
                <p className='text-sm'>
                  {(company.website && (
                    <a href={company.website} target='_blank' rel='noopener noreferrer' className='text-primary hover:underline'>
                      {company.website}
                    </a>
                  )) ||
                    'N/A'}
                </p>
              </div>
              <div>
                <Label className='text-muted-foreground text-xs'>{t('email')}</Label>
                <p className='text-sm'>{company.email || 'N/A'}</p>
              </div>
              <div>
                <Label className='text-muted-foreground text-xs'>{t('phone')}</Label>
                <p className='text-sm'>{company.phone || 'N/A'}</p>
              </div>
              <div>
                <Label className='text-muted-foreground text-xs'>{t('address')}</Label>
                <p className='text-sm'>{[company.address, company.city, company.state, company.country, company.postalCode].filter(Boolean).join(', ') || 'N/A'}</p>
              </div>
              <div>
                <Label className='text-muted-foreground text-xs'>{t('status')}</Label>
                <p className='text-sm'>
                  <ColorBadge type='status' value={company.status || ''} />
                </p>
              </div>
              <div className='items-cen flex justify-end'>
                <p className='text-muted-foreground text-xs'>{t('created_on', { date: formatDate(new Date(company.createdAt)) })}</p>
              </div>
            </div>
          </div>

          <div className='rounded-lg border bg-card p-4'>
            <h2 className='mb-3 font-medium'>{t('company_stats')}</h2>
            <div className='grid grid-cols-2 gap-4'>
              <div className='rounded-lg border bg-background p-4'>
                <div className='flex items-center gap-2'>
                  <Users className='size-5' />
                  <p className='font-medium text-sm'>{t('contacts')}</p>
                </div>
                <p className='mt-2 font-bold text-2xl'>{company.contactCount}</p>
              </div>
              <div className='rounded-lg border bg-background p-4'>
                <div className='flex items-center gap-2'>
                  <Users className='size-5' />
                  <p className='font-medium text-sm'>{t('teams')}</p>
                </div>
                <p className='mt-2 font-bold text-2xl'>{company.teamCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isEditModalOpen} onOpenChange={(open) => !open && handleCloseEdit()}>
        <DialogContent className='max-h-[90vh] max-w-xl overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>{t('edit_company_information')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit} className='space-y-4'>
            <div className='space-y-2'>
              <Label>{t('company')}</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className='space-y-2'>
              <Label>{t('description')}</Label>
              <Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>{t('industry')}</Label>
                <Input value={editForm.industry} onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })} />
              </div>
              <div className='space-y-2'>
                <Label>{t('size')}</Label>
                <Input value={editForm.size} onChange={(e) => setEditForm({ ...editForm, size: e.target.value })} />
              </div>
            </div>
            <div className='space-y-2'>
              <Label>{t('website')}</Label>
              <Input value={editForm.website} onChange={(e) => setEditForm({ ...editForm, website: e.target.value })} />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>{t('email')}</Label>
                <Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
              <div className='space-y-2'>
                <Label>{t('phone')}</Label>
                <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
            </div>
            <div className='space-y-2'>
              <Label>{t('address')}</Label>
              <Input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>{t('city')}</Label>
                <Input value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} />
              </div>
              <div className='space-y-2'>
                <Label>{t('state')}</Label>
                <Input value={editForm.state} onChange={(e) => setEditForm({ ...editForm, state: e.target.value })} />
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>{t('country')}</Label>
                <Input value={editForm.country} onChange={(e) => setEditForm({ ...editForm, country: e.target.value })} />
              </div>
              <div className='space-y-2'>
                <Label>{t('postal_code')}</Label>
                <Input value={editForm.postalCode} onChange={(e) => setEditForm({ ...editForm, postalCode: e.target.value })} />
              </div>
            </div>
            <div className='flex justify-end space-x-2'>
              <Button type='button' variant='outline' onClick={() => setIsEditModalOpen(false)}>
                {t('cancel')}
              </Button>
              <Button type='submit' disabled={updateCompany.isPending}>
                {updateCompany.isPending ? t('saving_loading') : t('save_changes')}
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
              teamId: companyId[0],
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
