'use client';

import { ActionAlertDialog } from '@/components/shared/action-alert-dialog';
import { PageHeader } from '@/components/shared/page-header';
import { PageLoading } from '@/components/shared/page-loading';
import { DataTable } from '@/components/shared/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { User, UserRole } from '@/lib/schema';
import { api } from '@/utils/trpc/client';
import { type ColumnDef, getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

export function SiteMembers() {
  const t = useTranslations();

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const utils = api.useUtils();

  const { data: users, isLoading } = api.admin.getUsers.useQuery();
  const { mutate: updateUser, isPending: updateUserPending } = api.admin.updateUser.useMutation({
    onSuccess: () => {
      utils.admin.getUsers.invalidate();
      toast.success(t('user_updated_successfully'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { mutate: deleteUser } = api.admin.deleteUser.useMutation({
    onSuccess: () => {
      utils.admin.getUsers.invalidate();
      toast.success(t('user_deleted_successfully'));
      setUserToDelete(null);
    },
    onError: (error) => {
      toast.error(error.message);
      setUserToDelete(null);
    },
  });

  const totalUsers = users?.length || 0;
  const adminUsers = users?.filter((user) => user.role === 'ADMIN').length || 0;

  const handleEditUser = (userData: User) => {
    setEditingUser(userData);
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;

    updateUser({
      id: editingUser.id,
      firstName: editingUser.firstName ?? undefined,
      lastName: editingUser.lastName ?? undefined,
      email: editingUser.email ?? undefined,
      username: editingUser.username ?? undefined,
      role: editingUser.role as UserRole,
    });

    setEditingUser(null);
  };

  const columns: ColumnDef<User>[] = [
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
      header: t('name'),
      enableSorting: true,
    },
    {
      accessorKey: 'username',
      header: t('username'),
      enableSorting: true,
    },
    {
      accessorKey: 'email',
      header: t('email'),
      enableSorting: true,
    },
    {
      accessorKey: 'role',
      header: t('role'),
      enableSorting: true,
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='h-8 w-8 p-0'>
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem className='cursor-pointer' onClick={() => handleEditUser(row.original)}>
              <Pencil className='mr-2 h-4 w-4' />
              {t('edit')}
            </DropdownMenuItem>
            {row.original.role !== 'ADMIN' && (
              <DropdownMenuItem className='cursor-pointer text-destructive' onClick={() => setUserToDelete(row.original)}>
                <Trash className='mr-2 h-4 w-4' />
                {t('delete')}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const table = useReactTable({
    data: users ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <div className='space-y-4'>
      <PageHeader title={t('site')} description={t('site_description')} />

      <div className='grid gap-4 md:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>{t('total_users')}</CardTitle>
            <CardDescription>Number of registered users</CardDescription>
          </CardHeader>
          <CardContent>
            <p className='font-bold text-3xl'>{totalUsers}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Admin Users</CardTitle>
            <CardDescription>Users with admin privileges</CardDescription>
          </CardHeader>
          <CardContent>
            <p className='font-bold text-3xl'>{adminUsers}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('user_management')}</CardTitle>
          <CardDescription>{t('user_management_description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable table={table} columns={columns} loading={isLoading} />
        </CardContent>
      </Card>

      <Dialog open={editingUser !== null} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className='max-h-[90vh] max-w-xl overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>{t('edit_user')}</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>{t('first_name')}</Label>
                <Input value={editingUser?.firstName ?? ''} onChange={(e) => setEditingUser((prev) => (prev ? { ...prev, firstName: e.target.value } : null))} />
              </div>
              <div className='space-y-2'>
                <Label>{t('last_name')}</Label>
                <Input value={editingUser?.lastName ?? ''} onChange={(e) => setEditingUser((prev) => (prev ? { ...prev, lastName: e.target.value } : null))} />
              </div>
            </div>

            <div className='space-y-2'>
              <Label>{t('email')}</Label>
              <Input type='email' value={editingUser?.email ?? ''} onChange={(e) => setEditingUser((prev) => (prev ? { ...prev, email: e.target.value } : null))} />
            </div>

            <div className='space-y-2'>
              <Label>{t('username')}</Label>
              <Input value={editingUser?.username ?? ''} onChange={(e) => setEditingUser((prev) => (prev ? { ...prev, username: e.target.value } : null))} />
            </div>

            <div className='space-y-2'>
              <Label>{t('role')}</Label>
              <Select value={editingUser?.role ?? undefined} onValueChange={(value: UserRole) => setEditingUser((prev) => (prev ? { ...prev, role: value } : null))}>
                <SelectTrigger>
                  <SelectValue placeholder={t('select_role')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='USER'>{t('user')}</SelectItem>
                  <SelectItem value='ADMIN'>{t('admin')}</SelectItem>
                  <SelectItem value='SALES_MANAGER'>{t('sales_manager')}</SelectItem>
                  <SelectItem value='SALES_ASSISTANT'>{t('sales_assistant')}</SelectItem>
                  <SelectItem value='MANAGER'>{t('manager')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setEditingUser(null)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleUpdateUser} disabled={updateUserPending}>
              {updateUserPending ? t('saving_loading') : t('save_changes')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ActionAlertDialog
        open={userToDelete !== null}
        onOpenChange={(open) => !open && setUserToDelete(null)}
        onConfirm={() => userToDelete && deleteUser(userToDelete.id)}
        title={t('delete_user')}
        description={t('delete_user_description')}
      />
    </div>
  );
}
