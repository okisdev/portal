'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/utils/trpc/client';
import { useRef, useState } from 'react';

export default function AccountSettingsPage() {
  const { data: me } = api.account.getMe.useQuery();
  const updateAccount = api.account.updateMe.useMutation();

  console.log('me', me);

  const [firstName, setFirstName] = useState(me?.firstName ?? '');
  const [lastName, setLastName] = useState(me?.lastName ?? '');
  const [email, setEmail] = useState(me?.email ?? '');
  const [image, setImage] = useState(me?.image ?? '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await updateAccount.mutateAsync({
        firstName,
        lastName,
        email,
        image,
      });
    } catch (error) {
      console.error('Failed to update account:', error);
    }
  };

  return (
    <div className='h-full flex-1 space-y-8 p-8 pt-6'>
      <div className='flex h-full flex-col space-y-8'>
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
              <Input type='email' id='email' value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>

          <div className='flex justify-end'>
            <Button type='submit' disabled={updateAccount.isPending}>
              {updateAccount.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
