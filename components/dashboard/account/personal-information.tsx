'use client';

import { BadgeX, Pencil, Verified } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { api } from '@/utils/trpc/client';

const USERNAME_REGEX = /^[a-z0-9_-]+$/;

interface PersonalInformationProps {
  initialData?: {
    firstName?: string;
    lastName?: string;
    username?: string;
    email?: string;
    emailVerified?: boolean;
  };
  isLoading: boolean;
  onEmailEditClick: () => void;
}

export function PersonalInformation({
  initialData,
  isLoading,
  onEmailEditClick,
}: PersonalInformationProps) {
  const t = useTranslations();
  const updateAccount = api.account.updateMe.useMutation();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [usernameError, setUsernameError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFirstName(initialData.firstName ?? '');
      setLastName(initialData.lastName ?? '');
      setUsername(initialData.username ?? '');
      setEmail(initialData.email ?? '');
    }
  }, [initialData]);

  const handleNameChange = async (
    field: 'firstName' | 'lastName',
    value: string
  ) => {
    // Check if value has actually changed
    if (
      (field === 'firstName' && value === initialData?.firstName) ||
      (field === 'lastName' && value === initialData?.lastName)
    ) {
      return;
    }

    const updateData =
      field === 'firstName' ? { firstName: value } : { lastName: value };
    try {
      await updateAccount.mutateAsync(updateData, {
        onSuccess: () => {
          toast.success(t('account_updated_successfully'));
        },
        onError: () => {
          toast.error(t('failed_to_update_account'));
        },
      });
    } catch (error) {
      console.error('Failed to update account:', error);
    }
  };

  const handleUsernameChange = async (value: string) => {
    // Clear previous error
    setUsernameError('');

    // Check if username has actually changed
    if (value === initialData?.username) {
      return;
    }

    // Validate username format
    if (!USERNAME_REGEX.test(value)) {
      setUsernameError(t('username_format_error'));
      return;
    }

    try {
      await updateAccount.mutateAsync(
        { username: value },
        {
          onSuccess: () => {
            toast.success(t('account_updated_successfully'));
          },
          onError: (error) => {
            if (error.message === 'Username already exists') {
              setUsernameError(t('username_already_exists'));
            } else {
              toast.error(t('failed_to_update_account'));
            }
          },
        }
      );
    } catch (error) {
      console.error('Failed to update username:', error);
    }
  };

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
            onBlur={(e) => handleNameChange('firstName', e.target.value)}
            onChange={(e) => setFirstName(e.target.value)}
            type='text'
            value={firstName}
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='lastName'>{t('last_name')}</Label>
          <Input
            id='lastName'
            onBlur={(e) => handleNameChange('lastName', e.target.value)}
            onChange={(e) => setLastName(e.target.value)}
            type='text'
            value={lastName}
          />
        </div>
      </div>
      <div className='space-y-2'>
        <Label htmlFor='username'>{t('username')}</Label>
        <Input
          id='username'
          onBlur={(e) => handleUsernameChange(e.target.value)}
          onChange={(e) => {
            const lowercaseValue = e.target.value
              .toLowerCase()
              .replace(/\s+/g, '');
            setUsername(lowercaseValue);
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
                {initialData?.emailVerified ? (
                  <Verified className='h-4 w-4 text-green-500' />
                ) : (
                  <BadgeX className='h-4 w-4 text-red-500' />
                )}
              </TooltipTrigger>
              <TooltipContent side='right'>
                <p>
                  {initialData?.emailVerified
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
