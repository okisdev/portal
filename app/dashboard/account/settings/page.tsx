'use client';

import { PageHeader } from '@/components/shared/page-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/utils/trpc/client';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export default function AccountSettingsPage() {
  const { data: me } = api.account.getMeFromDatabase.useQuery();
  const updateAccount = api.account.updateMe.useMutation();
  const updatePassword = api.account.updatePassword.useMutation();

  console.log('me', me);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [image, setImage] = useState('');

  useEffect(() => {
    if (me) {
      setFirstName(me.firstName ?? '');
      setLastName(me.lastName ?? '');
      setEmail(me.email ?? '');
      setImage(me.image ?? '');
    }
  }, [me]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await updateAccount.mutateAsync(
        {
          firstName,
          lastName,
          email,
          image,
        },
        {
          onSuccess: () => {
            toast.success('Account updated successfully');
          },
          onError: (error) => {
            toast.error('Failed to update account');
          },
        }
      );
    } catch (error) {
      console.error('Failed to update account:', error);
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      console.error('Passwords do not match');
      return;
    }
    try {
      await updatePassword.mutateAsync(
        {
          currentPassword,
          newPassword,
          confirmPassword,
        },
        {
          onSuccess: () => {
            toast.success('Password updated successfully');
          },
          onError: (error) => {
            toast.error('Failed to update password');
          },
        }
      );
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Failed to update password:', error);
    }
  };

  return (
    <div className='space-y-6'>
      <PageHeader title='Account Settings' description='Manage your account settings' />

      <div className='flex h-full flex-col space-y-8'>
        <Tabs defaultValue='profile' className='space-y-6'>
          <TabsList>
            <TabsTrigger value='profile'>Profile</TabsTrigger>
            <TabsTrigger value='password'>Password</TabsTrigger>
          </TabsList>

          <TabsContent value='profile' className='space-y-6'>
            <form onSubmit={handleSubmit} className='space-y-8'>
              <div className='flex items-center space-x-8'>
                <Avatar className='h-28 w-28'>
                  <AvatarImage src={image || '/default-avatar.png'} alt='Profile picture' />
                  <AvatarFallback>
                    {firstName?.[0]}
                    {lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className='space-y-2'>
                  <h2 className='font-semibold text-2xl tracking-tight'>Profile Picture</h2>
                  <p className='text-muted-foreground text-sm'>Update your profile picture</p>
                  <Button type='button' variant='outline' onClick={() => fileInputRef.current?.click()}>
                    Change Photo
                  </Button>
                  <Input type='file' ref={fileInputRef} onChange={handleImageUpload} accept='image/*' className='hidden' />
                </div>
              </div>

              <div className='space-y-4'>
                <h2 className='font-semibold text-2xl tracking-tight'>Personal Information</h2>
                <div className='grid grid-cols-2 gap-6'>
                  <div className='space-y-2'>
                    <Label htmlFor='firstName'>First Name</Label>
                    <Input type='text' id='firstName' value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='lastName'>Last Name</Label>
                    <Input type='text' id='lastName' value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className='space-y-4'>
                <h2 className='font-semibold text-2xl tracking-tight'>Contact Information</h2>
                <div className='space-y-2'>
                  <Label htmlFor='email'>Email Address</Label>
                  <div className='flex items-center gap-2'>
                    <Input type='email' id='email' value={email} onChange={(e) => setEmail(e.target.value)} />
                    {me?.emailVerified && <span className='inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 font-medium text-green-800 text-xs'>Verified</span>}
                  </div>
                </div>
              </div>

              <div className='flex justify-end'>
                <Button type='submit' disabled={updateAccount.isPending}>
                  {updateAccount.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value='password' className='space-y-6'>
            <div className='space-y-4'>
              <h2 className='font-semibold text-2xl tracking-tight'>Change Password</h2>
              <form onSubmit={handlePasswordSubmit} className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='currentPassword'>Current Password</Label>
                  <Input type='password' id='currentPassword' value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='newPassword'>New Password</Label>
                  <Input type='password' id='newPassword' value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='confirmPassword'>Confirm New Password</Label>
                  <Input type='password' id='confirmPassword' value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
                <div className='flex justify-end'>
                  <Button type='submit' disabled={updatePassword.isPending}>
                    {updatePassword.isPending ? 'Updating Password...' : 'Update Password'}
                  </Button>
                </div>
              </form>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
