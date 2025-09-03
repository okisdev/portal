'use client';

import { useTranslations } from 'next-intl';
import { useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ProfilePictureProps {
  image: string;
  firstName: string;
  lastName: string;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ProfilePicture({
  image,
  firstName,
  lastName,
  onImageUpload,
}: ProfilePictureProps) {
  const t = useTranslations();
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className='flex items-center space-x-8'>
      <Avatar className='h-28 w-28'>
        <AvatarImage
          alt='Profile picture'
          src={image || '/default-avatar.png'}
        />
        <AvatarFallback>
          {firstName?.[0]}
          {lastName?.[0]}
        </AvatarFallback>
      </Avatar>
      <div className='space-y-2'>
        <h2 className='font-medium text-xl tracking-tight'>
          {t('profile_picture')}
        </h2>
        <p className='text-muted-foreground text-sm'>
          {t('update_your_profile_picture')}
        </p>
        <Button
          onClick={() => fileInputRef.current?.click()}
          type='button'
          variant='outline'
        >
          {t('change_photo')}
        </Button>
        <Input
          accept='image/*'
          className='hidden'
          onChange={onImageUpload}
          ref={fileInputRef}
          type='file'
        />
      </div>
    </div>
  );
}
