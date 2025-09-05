'use client';

import { format } from 'date-fns';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  ChevronLeftIcon,
  ChevronRightIcon,
  Clock,
  EyeIcon,
  FilterIcon,
  SearchIcon,
  Users,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { DateRangePicker } from '@/components/shared/date-range-picker';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { AuditAction, AuditResource, AuditStatus } from '@/types/audit';
import { api } from '@/utils/trpc/client';

export default function AuditPage() {
  // State for filters
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [filters, setFilters] = useState({
    userId: '',
    action: undefined as AuditAction | undefined,
    resource: undefined as AuditResource | undefined,
    routerName: '',
    procedureName: '',
    status: undefined as AuditStatus | undefined,
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    search: '',
  });

  // State for detailed view
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  // Fetch audit logs
  const {
    data: logsData,
    isLoading,
    error,
  } = api.audit.getLogs.useQuery({
    page,
    pageSize,
    ...filters,
  });

  // Fetch audit statistics
  const { data: statsData } = api.audit.getStats.useQuery({
    startDate: filters.startDate,
    endDate: filters.endDate,
  });

  // Fetch detailed log entry
  const { data: selectedLog } = api.audit.getLogById.useQuery(
    { id: selectedLogId ?? '' },
    { enabled: !!selectedLogId }
  );

  const handleFilterChange = (
    key: keyof typeof filters,
    value: string | AuditAction | AuditResource | AuditStatus | undefined
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setPage(1); // Reset to first page when filtering
  };

  const handleDateRangeChange = (
    range: { from?: Date; to?: Date } | undefined
  ) => {
    setFilters((prev) => ({
      ...prev,
      startDate: range?.from,
      endDate: range?.to,
    }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      userId: '',
      action: undefined,
      resource: undefined,
      routerName: '',
      procedureName: '',
      status: undefined,
      startDate: undefined,
      endDate: undefined,
      search: '',
    });
    setPage(1);
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'default';
      case 'UPDATE':
        return 'secondary';
      case 'DELETE':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'default';
      case 'FAILED':
        return 'destructive';
      case 'PENDING':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle className='h-4 w-4' />;
      case 'FAILED':
        return <XCircle className='h-4 w-4' />;
      case 'PENDING':
        return <Clock className='h-4 w-4' />;
      default:
        return <Activity className='h-4 w-4' />;
    }
  };

  if (error) {
    toast.error('Failed to load audit logs');
    return <div>Error loading audit logs</div>;
  }

  return (
    <div className='container mx-auto max-w-7xl space-y-6 px-4 pt-10'>
      <PageHeader
        description='Track all system activities and changes'
        title='Audit Logs'
      />

      {/* Statistics Cards */}
      {statsData && (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='font-medium text-sm'>
                Total Actions
              </CardTitle>
              <Activity className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='font-bold text-2xl'>{statsData.total.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='font-medium text-sm'>
                Success Rate
              </CardTitle>
              <CheckCircle className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='font-bold text-2xl'>
                {statsData.total.total > 0
                  ? Math.round(
                      (statsData.total.successful / statsData.total.total) * 100
                    )
                  : 0}
                %
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='font-medium text-sm'>
                Failed Actions
              </CardTitle>
              <AlertTriangle className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='font-bold text-2xl'>{statsData.total.failed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='font-medium text-sm'>
                Active Users
              </CardTitle>
              <Users className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='font-bold text-2xl'>
                {statsData.topUsers.length}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <FilterIcon className='h-4 w-4' />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            <div className='space-y-2'>
              <Label htmlFor='search'>Search</Label>
              <div className='relative'>
                <SearchIcon className='absolute top-2.5 left-2 h-4 w-4 text-muted-foreground' />
                <Input
                  className='pl-8'
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder='Search procedures, resources...'
                  value={filters.search}
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='action'>Action</Label>
              <Select
                onValueChange={(value) =>
                  handleFilterChange(
                    'action',
                    value === 'all' ? undefined : (value as AuditAction)
                  )
                }
                value={filters.action || 'all'}
              >
                <SelectTrigger>
                  <SelectValue placeholder='All actions' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All actions</SelectItem>
                  <SelectItem value='CREATE'>Create</SelectItem>
                  <SelectItem value='UPDATE'>Update</SelectItem>
                  <SelectItem value='DELETE'>Delete</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='resource'>Resource</Label>
              <Select
                onValueChange={(value) =>
                  handleFilterChange(
                    'resource',
                    value === 'all' ? undefined : (value as AuditResource)
                  )
                }
                value={filters.resource || 'all'}
              >
                <SelectTrigger>
                  <SelectValue placeholder='All resources' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All resources</SelectItem>
                  <SelectItem value='account'>Account</SelectItem>
                  <SelectItem value='admin'>Admin</SelectItem>
                  <SelectItem value='api-key'>API Key</SelectItem>
                  <SelectItem value='calendar'>Calendar</SelectItem>
                  <SelectItem value='company'>Company</SelectItem>
                  <SelectItem value='contact'>Contact</SelectItem>
                  <SelectItem value='resource'>Resource</SelectItem>
                  <SelectItem value='site'>Site</SelectItem>
                  <SelectItem value='task'>Task</SelectItem>
                  <SelectItem value='team'>Team</SelectItem>
                  <SelectItem value='user'>User</SelectItem>
                  <SelectItem value='notification'>Notification</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='status'>Status</Label>
              <Select
                onValueChange={(value) =>
                  handleFilterChange(
                    'status',
                    value === 'all' ? undefined : (value as AuditStatus)
                  )
                }
                value={filters.status || 'all'}
              >
                <SelectTrigger>
                  <SelectValue placeholder='All statuses' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All statuses</SelectItem>
                  <SelectItem value='SUCCESS'>Success</SelectItem>
                  <SelectItem value='FAILED'>Failed</SelectItem>
                  <SelectItem value='PENDING'>Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='dateRange'>Date Range</Label>
              <DateRangePicker
                initialDateFrom={filters.startDate}
                initialDateTo={filters.endDate}
                onChange={handleDateRangeChange}
              />
            </div>

            <div className='flex items-end'>
              <Button onClick={clearFilters} variant='outline'>
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='flex items-center justify-center py-8'>
              <div className='text-muted-foreground'>Loading audit logs...</div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Procedure</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logsData?.data.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {format(new Date(log.createdAt), 'MMM dd, HH:mm:ss')}
                      </TableCell>
                      <TableCell>
                        <div className='flex flex-col'>
                          <span className='font-medium'>
                            {log.user.name ||
                              `${log.user.firstName} ${log.user.lastName}` ||
                              'Unknown'}
                          </span>
                          <span className='text-muted-foreground text-sm'>
                            {log.user.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant='outline'>{log.resource}</Badge>
                      </TableCell>
                      <TableCell>
                        <code className='rounded bg-muted px-1 py-0.5 text-xs'>
                          {log.routerName}.{log.procedureName}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          {getStatusIcon(log.status)}
                          <Badge variant={getStatusBadgeVariant(log.status)}>
                            {log.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.duration ? `${log.duration}ms` : '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => setSelectedLogId(log.id)}
                          size='sm'
                          variant='ghost'
                        >
                          <EyeIcon className='h-4 w-4' />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {logsData && (
                <div className='mt-4 flex items-center justify-between'>
                  <div className='text-muted-foreground text-sm'>
                    Showing{' '}
                    {Math.min((page - 1) * pageSize + 1, logsData.totalCount)}{' '}
                    to {Math.min(page * pageSize, logsData.totalCount)} of{' '}
                    {logsData.totalCount} results
                  </div>
                  <div className='flex items-center space-x-2'>
                    <Button
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      size='sm'
                      variant='outline'
                    >
                      <ChevronLeftIcon className='h-4 w-4' />
                      Previous
                    </Button>
                    <div className='flex items-center space-x-1'>
                      <span className='text-muted-foreground text-sm'>
                        Page {page} of {logsData.totalPages}
                      </span>
                    </div>
                    <Button
                      disabled={page >= logsData.totalPages}
                      onClick={() =>
                        setPage((p) => Math.min(logsData.totalPages, p + 1))
                      }
                      size='sm'
                      variant='outline'
                    >
                      Next
                      <ChevronRightIcon className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Detailed Log View Dialog */}
      <Dialog
        onOpenChange={() => setSelectedLogId(null)}
        open={!!selectedLogId}
      >
        <DialogContent className='max-h-[80vh] max-w-4xl overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='user'>User</Label>
                  <p className='text-muted-foreground text-sm'>
                    {selectedLog.user.name ||
                      `${selectedLog.user.firstName} ${selectedLog.user.lastName}`}{' '}
                    ({selectedLog.user.email})
                  </p>
                </div>
                <div>
                  <Label htmlFor='timestamp'>Timestamp</Label>
                  <p className='text-muted-foreground text-sm'>
                    {format(new Date(selectedLog.createdAt), 'PPpp')}
                  </p>
                </div>
                <div>
                  <Label htmlFor='action'>Action</Label>
                  <div className='flex items-center gap-2'>
                    <Badge variant={getActionBadgeVariant(selectedLog.action)}>
                      {selectedLog.action}
                    </Badge>
                    <Badge variant='outline'>{selectedLog.resource}</Badge>
                  </div>
                </div>
                <div>
                  <Label htmlFor='status'>Status</Label>
                  <div className='flex items-center gap-2'>
                    {getStatusIcon(selectedLog.status)}
                    <Badge variant={getStatusBadgeVariant(selectedLog.status)}>
                      {selectedLog.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label htmlFor='procedure'>Procedure</Label>
                  <p className='rounded bg-muted px-2 py-1 font-mono text-sm'>
                    {selectedLog.routerName}.{selectedLog.procedureName}
                  </p>
                </div>
                <div>
                  <Label htmlFor='duration'>Duration</Label>
                  <p className='text-muted-foreground text-sm'>
                    {selectedLog.duration ? `${selectedLog.duration}ms` : 'N/A'}
                  </p>
                </div>
                {selectedLog.resourceId && (
                  <div>
                    <Label htmlFor='resourceId'>Resource ID</Label>
                    <p className='rounded bg-muted px-2 py-1 font-mono text-sm'>
                      {selectedLog.resourceId}
                    </p>
                  </div>
                )}
                {selectedLog.ipAddress && (
                  <div>
                    <Label htmlFor='ipAddress'>IP Address</Label>
                    <p className='text-muted-foreground text-sm'>
                      {selectedLog.ipAddress}
                    </p>
                  </div>
                )}
              </div>

              {selectedLog.errorMessage && (
                <div>
                  <Label className='text-destructive' htmlFor='errorMessage'>
                    Error Message
                  </Label>
                  <div className='mt-1 rounded-md border border-destructive/20 bg-destructive/10 p-3'>
                    <code className='text-destructive text-sm'>
                      {selectedLog.errorMessage}
                    </code>
                  </div>
                </div>
              )}

              {selectedLog.inputData && (
                <div>
                  <Label htmlFor='inputData'>Input Data</Label>
                  <div className='mt-1 rounded-md border bg-muted/50 p-3'>
                    <pre className='overflow-x-auto text-xs'>
                      {JSON.stringify(
                        JSON.parse(selectedLog.inputData),
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </div>
              )}

              {selectedLog.previousData && (
                <div>
                  <Label htmlFor='previousData'>Previous Data</Label>
                  <div className='mt-1 rounded-md border bg-muted/50 p-3'>
                    <pre className='overflow-x-auto text-xs'>
                      {JSON.stringify(
                        JSON.parse(selectedLog.previousData),
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </div>
              )}

              {selectedLog.newData && (
                <div>
                  <Label htmlFor='newData'>New Data</Label>
                  <div className='mt-1 rounded-md border bg-muted/50 p-3'>
                    <pre className='overflow-x-auto text-xs'>
                      {JSON.stringify(JSON.parse(selectedLog.newData), null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {selectedLog.metadata && (
                <div>
                  <Label htmlFor='metadata'>Metadata</Label>
                  <div className='mt-1 rounded-md border bg-muted/50 p-3'>
                    <pre className='overflow-x-auto text-xs'>
                      {JSON.stringify(
                        JSON.parse(selectedLog.metadata),
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
