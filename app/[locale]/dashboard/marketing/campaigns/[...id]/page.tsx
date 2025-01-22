'use client';

import { ActionAlertDialog } from '@/components/shared/action-alert-dialog';
import { ColorBadge } from '@/components/shared/color-badge';
import { PageHeader } from '@/components/shared/page-header';
import { PageLoading } from '@/components/shared/page-loading';
import { TableLoading } from '@/components/shared/table-loading';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useDebounce } from '@/hooks/use-debounce';
import { cn, formatDate } from '@/lib/utils';
import { api } from '@/utils/trpc/client';
import { CaretSortIcon } from '@radix-ui/react-icons';
import { Eye, Filter, MoreHorizontal, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

type SortConfig = {
  column: string;
  direction: 'asc' | 'desc';
};

type FilterOperator = '=' | '!=' | 'contains' | 'startsWith' | 'endsWith';

type FilterCondition = {
  field: string;
  operator: FilterOperator;
  value: string;
};

type FilterConfig = {
  conditions: FilterCondition[];
  matchAll: boolean;
};

type ColumnConfig = {
  id: string;
  label: string;
  visible: boolean;
};

export default function CampaignDetailsPage() {
  const router = useRouter();
  const { id: campaignId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  const { data: campaign, isLoading: campaignLoading } = api.marketing.getCampaignById.useQuery({
    id: campaignId[0],
  });

  const { data: contacts = [], isLoading: contactsLoading } = api.marketing.getCampaignContacts.useQuery({
    campaignId: campaignId[0],
  });

  const utils = api.useUtils();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: '', direction: 'asc' });

  const [filters, setFilters] = useState<FilterConfig>({
    conditions: [],
    matchAll: true,
  });

  const [columns, setColumns] = useState<ColumnConfig[]>([
    { id: 'name', label: 'Name', visible: true },
    { id: 'email', label: 'Email', visible: true },
    { id: 'company', label: 'Company', visible: true },
    { id: 'status', label: 'Status', visible: true },
    { id: 'signupDate', label: 'Signup Date', visible: true },
    { id: 'conversionDate', label: 'Conversion Date', visible: true },
    { id: 'source', label: 'Source', visible: true },
    { id: 'actions', label: 'Actions', visible: true },
  ]);

  const filterFields = [
    { label: 'Name', value: 'name' },
    { label: 'Email', value: 'email' },
    { label: 'Company', value: 'company' },
    { label: 'Status', value: 'status' },
    { label: 'Source', value: 'source' },
  ];

  const filterOperators: { label: string; value: FilterOperator }[] = [
    { label: 'Equals', value: '=' },
    { label: 'Not equals', value: '!=' },
    { label: 'Contains', value: 'contains' },
    { label: 'Starts with', value: 'startsWith' },
    { label: 'Ends with', value: 'endsWith' },
  ];

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);

  const removeContactFromCampaign = api.marketing.removeContactFromCampaign.useMutation({
    onSuccess: () => {
      utils.marketing.getCampaignContacts.invalidate();
      utils.marketing.getCampaignById.invalidate();
    },
  });

  const updateContactStatus = api.marketing.updateContactCampaignStatus.useMutation({
    onSuccess: () => {
      utils.marketing.getCampaignContacts.invalidate();
      utils.marketing.getCampaignById.invalidate();
    },
  });

  const handleFilterChange = (index: number, field: string, operator: FilterOperator, value: string) => {
    const newConditions = [...filters.conditions];
    if (index >= newConditions.length) {
      newConditions.push({ field, operator, value });
    } else {
      newConditions[index] = { field, operator, value };
    }
    setFilters((prev) => ({
      ...prev,
      conditions: newConditions,
    }));
  };

  const handleRemoveFilter = (index: number) => {
    setFilters((prev) => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index),
    }));
  };

  const filteredContacts = useMemo(() => {
    if (!contacts) return [];

    return contacts
      .filter((contact) => {
        if (debouncedSearch) {
          const searchTerm = debouncedSearch.toLowerCase();
          const name = contact.name?.toLowerCase();
          const email = contact.email.toLowerCase();
          const company = (contact.company || '').toLowerCase();
          const status = contact.status.toLowerCase();
          const source = (contact.source || '').toLowerCase();

          return name?.includes(searchTerm) || email.includes(searchTerm) || company.includes(searchTerm) || status.includes(searchTerm) || source.includes(searchTerm);
        }

        if (filters.conditions.length === 0) return true;

        return filters.conditions.every((condition) => {
          const fieldValue = String(contact[condition.field as keyof typeof contact] || '').toLowerCase();
          const compareValue = condition.value.toLowerCase();

          switch (condition.operator) {
            case '=':
              return fieldValue === compareValue;
            case '!=':
              return fieldValue !== compareValue;
            case 'contains':
              return fieldValue.includes(compareValue);
            case 'startsWith':
              return fieldValue.startsWith(compareValue);
            case 'endsWith':
              return fieldValue.endsWith(compareValue);
            default:
              return false;
          }
        });
      })
      .sort((a, b) => {
        if (!sortConfig.column) return 0;

        let aValue: string | Date;
        let bValue: string | Date;

        if (sortConfig.column === 'signupDate' || sortConfig.column === 'conversionDate') {
          aValue = new Date(a[sortConfig.column as keyof typeof a] || '');
          bValue = new Date(b[sortConfig.column as keyof typeof b] || '');
        } else {
          aValue = String(a[sortConfig.column as keyof typeof a] || '');
          bValue = String(b[sortConfig.column as keyof typeof b] || '');
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
  }, [contacts, filters, sortConfig, debouncedSearch]);

  const handleSort = (column: string) => {
    setSortConfig((current) => ({
      column,
      direction: current.column === column && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleDeleteClick = (contactId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setContactToDelete(contactId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (contactToDelete) {
      await removeContactFromCampaign.mutate({
        campaignId: campaignId[0],
        contactId: contactToDelete,
      });
      setDeleteDialogOpen(false);
      setContactToDelete(null);
    }
  };

  const handleStatusChange = async (contactId: string, status: 'pending' | 'engaged' | 'converted' | 'bounced' | 'unsubscribed') => {
    await updateContactStatus.mutate({
      campaignId: campaignId[0],
      contactId,
      status,
    });
  };

  if (campaignLoading) {
    return <PageLoading />;
  }

  if (!campaign) {
    return <div>Campaign not found</div>;
  }

  return (
    <div className='space-y-4 p-4'>
      <PageHeader
        title={campaign.name}
        description={campaign.description || 'No description'}
        right={
          <Button variant='outline' size='sm' asChild>
            <Link href={`/dashboard/marketing/campaigns/${campaignId}/edit`}>Edit Campaign</Link>
          </Button>
        }
      />

      <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
        <Card>
          <CardHeader>
            <CardTitle className='text-sm'>Total Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{campaign.contactCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className='text-sm'>Converted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {campaign.convertedCount} ({campaign.contactCount > 0 ? Math.round((campaign.convertedCount / campaign.contactCount) * 100) : 0}%)
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className='text-sm'>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ColorBadge type='campaignStatus' value={campaign.status} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className='text-sm'>Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='capitalize'>{campaign.type}</div>
          </CardContent>
        </Card>
      </div>

      <div className='flex flex-col gap-4'>
        <div className='flex items-center justify-between gap-4'>
          <div className='flex flex-row gap-2'>
            <Input placeholder='Search contacts...' value={search} onChange={(e) => setSearch(e.target.value)} className='h-8 w-72 max-w-sm' disabled={contactsLoading} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' size='sm' disabled={contactsLoading}>
                  <Filter className='mr-2 h-4 w-4' />
                  Filters ({filters.conditions.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className='w-[350px] p-4'>
                <div className='space-y-4'>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm font-medium'>Match:</span>
                    <Button variant='ghost' size='sm' onClick={() => setFilters((f) => ({ ...f, matchAll: !f.matchAll }))}>
                      {filters.matchAll ? 'ALL conditions' : 'ANY condition'}
                    </Button>
                  </div>

                  {filters.conditions.map((condition, index) => (
                    <div key={`${condition.field}-${index}`} className='flex items-center gap-2'>
                      <select className='h-8 rounded-md border px-2 text-sm' value={condition.field} onChange={(e) => handleFilterChange(index, e.target.value, condition.operator, condition.value)}>
                        {filterFields.map((field) => (
                          <option key={field.value} value={field.value}>
                            {field.label}
                          </option>
                        ))}
                      </select>

                      <select
                        className='h-8 rounded-md border px-2 text-sm'
                        value={condition.operator}
                        onChange={(e) => handleFilterChange(index, condition.field, e.target.value as FilterOperator, condition.value)}
                      >
                        {filterOperators.map((op) => (
                          <option key={op.value} value={op.value}>
                            {op.label}
                          </option>
                        ))}
                      </select>

                      <Input className='h-8' value={condition.value} onChange={(e) => handleFilterChange(index, condition.field, condition.operator, e.target.value)} />

                      <Button variant='ghost' size='sm' onClick={() => handleRemoveFilter(index)}>
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  ))}

                  <Button
                    variant='outline'
                    size='sm'
                    className='w-full'
                    onClick={() => {
                      setFilters((f) => ({
                        ...f,
                        conditions: [...f.conditions, { field: filterFields[0].value, operator: '=', value: '' }],
                      }));
                    }}
                  >
                    Add Condition
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Button variant='outline' size='sm' asChild>
            <Link href={`/dashboard/marketing/campaigns/${campaignId}/contacts/add`}>Add Contact</Link>
          </Button>
        </div>
      </div>

      <div className='rounded-md border'>
        {contactsLoading ? (
          <TableLoading columnCount={columns.filter((col) => col.visible).length} rowCount={8} />
        ) : (
          <div className='relative'>
            <div className='max-h-[800px] overflow-auto'>
              <Table>
                <TableHeader className='sticky'>
                  <TableRow>
                    {columns.map(
                      (column) =>
                        column.visible && (
                          <TableHead key={column.id} onClick={() => handleSort(column.id)} className={cn('cursor-pointer', column.label === 'Actions' && 'text-right')}>
                            {column.label} {sortConfig.column === column.id && <CaretSortIcon className='ml-2 inline' />}
                          </TableHead>
                        )
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map((contact) => (
                    <TableRow key={contact.id} className='cursor-pointer hover:bg-muted/50' onClick={() => router.push(`/dashboard/crm/contacts/${contact.id}`)}>
                      {columns.map(
                        (column) =>
                          column.visible && (
                            <TableCell key={column.id}>
                              {column.id === 'name' && (
                                <div className='flex items-center gap-2'>
                                  <Avatar className='h-8 w-8'>
                                    <AvatarFallback>{contact.name?.[0]}</AvatarFallback>
                                  </Avatar>
                                  <div className='font-medium'>{contact.name}</div>
                                </div>
                              )}
                              {column.id === 'email' && contact.email}
                              {column.id === 'company' && contact.company}
                              {column.id === 'status' && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant='ghost' className='p-0'>
                                      <ColorBadge type='status' value={contact.status} />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => handleStatusChange(contact.id, 'pending')}>Pending</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange(contact.id, 'engaged')}>Engaged</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange(contact.id, 'converted')}>Converted</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange(contact.id, 'bounced')}>Bounced</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange(contact.id, 'unsubscribed')}>Unsubscribed</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                              {column.id === 'signupDate' && formatDate(new Date(contact.signupDate))}
                              {column.id === 'conversionDate' && (contact.conversionDate ? formatDate(new Date(contact.conversionDate)) : '—')}
                              {column.id === 'source' && <span className='capitalize'>{contact.source || '—'}</span>}
                              {column.id === 'actions' && (
                                <div className='flex justify-end'>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                      <Button variant='ghost' className='h-8 w-8 p-0'>
                                        <MoreHorizontal className='h-4 w-4' />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align='end'>
                                      <DropdownMenuItem onClick={(e) => router.push(`/dashboard/crm/contacts/${contact.id}?mode=edit`)}>
                                        <Eye className='mr-2 h-4 w-4' />
                                        View
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className='text-destructive' onClick={(e) => handleDeleteClick(contact.id, e)}>
                                        <Trash2 className='mr-2 h-4 w-4' />
                                        Remove
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              )}
                            </TableCell>
                          )
                      )}
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={columns.filter((col) => col.visible).length}>
                      Showing {filteredContacts.length} of {contacts?.length} contacts
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </div>
        )}
      </div>

      <ActionAlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title='Remove Contact'
        description='Are you sure you want to remove this contact from the campaign? This action cannot be undone.'
        confirmText='Remove'
        cancelText='Cancel'
      />
    </div>
  );
}
