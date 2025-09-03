'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { BadgeX, Pencil, Verified } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { api } from '@/utils/trpc/client';

const USERNAME_REGEX = /^[a-z0-9_-]+$/;

const personalInfoSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  username: z
    .string()
    .min(1, 'Username is required')
    .regex(
      USERNAME_REGEX,
      'Username can only contain lowercase letters, numbers, hyphens, and underscores'
    ),
  email: z.string().email().optional(),
});

type PersonalInfoFormValues = z.infer<typeof personalInfoSchema>;

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

  const form = useForm<PersonalInfoFormValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      username: '',
      email: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        firstName: initialData.firstName ?? '',
        lastName: initialData.lastName ?? '',
        username: initialData.username ?? '',
        email: initialData.email ?? '',
      });
    }
  }, [initialData, form]);

  const handleFieldUpdate = async (
    field: 'firstName' | 'lastName' | 'username',
    value: string
  ) => {
    // Check if value has actually changed
    const currentValue = initialData?.[field];
    if (value === currentValue) {
      return;
    }

    try {
      await updateAccount.mutateAsync(
        { [field]: value },
        {
          onSuccess: () => {
            toast.success(t('account_updated_successfully'));
          },
          onError: (error) => {
            if (
              field === 'username' &&
              error.message === 'Username already exists'
            ) {
              form.setError('username', {
                type: 'manual',
                message: t('username_already_exists'),
              });
            } else {
              toast.error(t('failed_to_update_account'));
            }
          },
        }
      );
    } catch (error) {
      console.error(`Failed to update ${field}:`, error);
    }
  };

  return (
    <div className='space-y-4'>
      <h2 className='font-medium text-xl tracking-tight'>
        {t('personal_information')}
      </h2>

      <Form {...form}>
        <div className='grid grid-cols-2 gap-6'>
          <FormField
            control={form.control}
            name='firstName'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('first_name')}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    onBlur={(e) => {
                      field.onBlur();
                      handleFieldUpdate('firstName', e.target.value);
                    }}
                    type='text'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='lastName'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('last_name')}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    onBlur={(e) => {
                      field.onBlur();
                      handleFieldUpdate('lastName', e.target.value);
                    }}
                    type='text'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name='username'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('username')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  onBlur={async (e) => {
                    field.onBlur();
                    const isValid = await form.trigger('username');
                    if (isValid) {
                      handleFieldUpdate('username', e.target.value);
                    }
                  }}
                  onChange={(e) => {
                    const lowercaseValue = e.target.value
                      .toLowerCase()
                      .replace(/\s+/g, '');
                    field.onChange(lowercaseValue);
                  }}
                  placeholder={t('enter_username')}
                  type='text'
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='flex items-center gap-2'>
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
              </FormLabel>
              <div className='flex items-center gap-2'>
                <FormControl>
                  <Input
                    {...field}
                    className='cursor-default'
                    readOnly
                    type='email'
                  />
                </FormControl>
                <Button
                  className='shrink-0'
                  onClick={onEmailEditClick}
                  size='icon'
                  variant='outline'
                >
                  <Pencil className='h-4 w-4' />
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </Form>
    </div>
  );
}
