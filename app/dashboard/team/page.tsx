'use client';

import { PageHeader } from '@/components/shared/page-header';
import { PageLoading } from '@/components/shared/page-loading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { User, UserRole } from '@/lib/schema';
import { api } from '@/utils/trpc/client';
import { Delete, Pencil } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function TeamPage() {
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const utils = api.useUtils();

  const { data: users, isLoading } = api.admin.getUsers.useQuery();
  const { mutate: updateUser } = api.admin.updateUser.useMutation({
    onSuccess: () => {
      utils.admin.getUsers.invalidate();
      toast.success('User updated successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { mutate: deleteUser } = api.admin.deleteUser.useMutation({
    onSuccess: () => {
      utils.admin.getUsers.invalidate();
      toast.success('User deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message);
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

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <div className='space-y-4 p-4'>
      <PageHeader title='Team' description='Manage your team members and settings' />

      <div className='grid gap-4 md:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
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
          <CardTitle>User Management</CardTitle>
          <CardDescription>Manage user roles and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name ?? 'N/A'}</TableCell>
                  <TableCell>{user.username ?? 'N/A'}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell className='space-x-2 text-right'>
                    <Button variant='outline' size='sm' onClick={() => handleEditUser(user)}>
                      <Pencil className='h-4 w-4' />
                    </Button>
                    <Button variant='destructive' size='sm' onClick={() => deleteUser(user.id)}>
                      <Delete className='h-4 w-4' />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={editingUser !== null} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>First Name</Label>
                <Input value={editingUser?.firstName ?? ''} onChange={(e) => setEditingUser((prev) => (prev ? { ...prev, firstName: e.target.value } : null))} />
              </div>
              <div className='space-y-2'>
                <Label>Last Name</Label>
                <Input value={editingUser?.lastName ?? ''} onChange={(e) => setEditingUser((prev) => (prev ? { ...prev, lastName: e.target.value } : null))} />
              </div>
            </div>

            <div className='space-y-2'>
              <Label>Email</Label>
              <Input type='email' value={editingUser?.email ?? ''} onChange={(e) => setEditingUser((prev) => (prev ? { ...prev, email: e.target.value } : null))} />
            </div>

            <div className='space-y-2'>
              <Label>Username</Label>
              <Input value={editingUser?.username ?? ''} onChange={(e) => setEditingUser((prev) => (prev ? { ...prev, username: e.target.value } : null))} />
            </div>

            <div className='space-y-2'>
              <Label>Role</Label>
              <Select value={editingUser?.role ?? undefined} onValueChange={(value: UserRole) => setEditingUser((prev) => (prev ? { ...prev, role: value } : null))}>
                <SelectTrigger>
                  <SelectValue placeholder='Select role' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='USER'>User</SelectItem>
                  <SelectItem value='ADMIN'>Admin</SelectItem>
                  <SelectItem value='SALES'>Sales</SelectItem>
                  <SelectItem value='MANAGER'>Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
