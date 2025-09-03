'use client';

import { BadgeX, Pencil, Verified } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PersonalInformationProps {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  usernameError: string;
  isEmailVerified?: boolean;
  isLoading: boolean;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onUsernameChange: (value: string) => void;
  onNameBlur: (field: 'firstName' | 'lastName', value: string) => void;
  onUsernameBlur: (value: string) => void;
  onEmailEditClick: () => void;
}

export function PersonalInformation({
  firstName,
  lastName,
  username,
  email,
  usernameError,
  isEmailVerified,
  isLoading,
  onFirstNameChange,
  onLastNameChange,
  onUsernameChange,
  onNameBlur,
  onUsernameBlur,
  onEmailEditClick,
}: PersonalInformationProps) {
  const t = useTranslations();

  return (
    <div className='space-y-4'>
      <h2 className='font-medium text-xl tracking-tight'>
        {t('personal_information')}
      </h2>
      <div className='grid grid-cols-2 gap-6'>
        <div className='space-y-2'>
          <Label htmlFor='firstName'>{t('first_name')}</Label>
          <Input
            id='firstName'
            onBlur={(e) => onNameBlur('firstName', e.target.value)}
            onChange={(e) => onFirstNameChange(e.target.value)}
            type='text'
            value={firstName}
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='lastName'>{t('last_name')}</Label>
          <Input
            id='lastName'
            onBlur={(e) => onNameBlur('lastName', e.target.value)}
            onChange={(e) => onLastNameChange(e.target.value)}
            type='text'
            value={lastName}
          />
        </div>
      </div>
      <div className='space-y-2'>
        <Label htmlFor='username'>{t('username')}</Label>
        <Input
          id='username'
          onBlur={(e) => onUsernameBlur(e.target.value)}
          onChange={(e) => {
            const lowercaseValue = e.target.value
              .toLowerCase()
              .replace(/\s+/g, '');
            onUsernameChange(lowercaseValue);
          }}
          placeholder={t('enter_username')}
          type='text'
          value={username}
        />
        {usernameError && (
          <p className='text-destructive text-sm'>{usernameError}</p>
        )}
      </div>
      <div className='space-y-2'>
        <Label className='flex items-center gap-2' htmlFor='email'>
          {t('email_address')}
          {!isLoading && (
            <Tooltip>
              <TooltipTrigger>
                {isEmailVerified ? (
                  <Verified className='h-4 w-4 text-green-500' />
                ) : (
                  <BadgeX className='h-4 w-4 text-red-500' />
                )}
              </TooltipTrigger>
              <TooltipContent side='right'>
                <p>
                  {isEmailVerified
                    ? t('email_verified')
                    : t('email_not_verified')}
                </p>
              </TooltipContent>
            </Tooltip>
          )}
        </Label>
        <div className='flex items-center gap-2'>
          <Input
            className='cursor-default'
            id='email'
            readOnly
            type='email'
            value={email}
          />
          <Button
            className='shrink-0'
            onClick={onEmailEditClick}
            size='icon'
            variant='outline'
          >
            <Pencil className='h-4 w-4' />
          </Button>
        </div>
      </div>
    </div>
  );
}
