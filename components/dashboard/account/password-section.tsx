'use client';

import { zodResolver } from '@hookform/resolvers/zod';
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
import { authClient, signOut } from '@/lib/auth.client';

const passwordSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

interface PasswordSectionProps {
  initialHasPassword?: boolean;
  userEmail?: string;
  onForgotPassword?: () => void;
  setPasswordAction: (
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
}

export function PasswordSection({
  initialHasPassword = false,
  userEmail,
  onForgotPassword,
  setPasswordAction,
}: PasswordSectionProps) {
  const t = useTranslations();

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    // Reset form when component mounts
    form.reset({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  }, [form]);

  const handlePasswordSubmit = async (data: PasswordFormValues) => {
    try {
      if (initialHasPassword && data.currentPassword) {
        // User has existing password - use changePassword
        await authClient.changePassword(
          {
            currentPassword: data.currentPassword,
            newPassword: data.newPassword,
          },
          {
            onSuccess: () => {
              toast.success(t('password_updated_successfully'));
              form.reset();
            },
            onError: () => {
              form.setError('currentPassword', {
                type: 'manual',
                message: t('invalid_current_password'),
              });
            },
          }
        );
      } else {
        // User doesn't have password - use setPassword server action
        const result = await setPasswordAction(data.newPassword);

        if (result.success) {
          toast.success(t('password_created_successfully'));
          form.reset();
        } else {
          toast.error(result.error || t('failed_to_create_password'));
        }
      }
    } catch (error) {
      console.error('Failed to handle password operation:', error);
      toast.error(t('unexpected_error'));
    }
  };

  const handleForgotPassword = async () => {
    if (onForgotPassword) {
      onForgotPassword();
      return;
    }

    // Default forgot password logic
    if (!userEmail) {
      toast.error(t('no_email_found'));
      return;
    }

    try {
      await authClient.forgetPassword({
        email: userEmail,
        redirectTo: `${window.location.origin}/reset-password?email=${userEmail}`,
        fetchOptions: {
          onSuccess: async () => {
            toast.success(t('password_reset_email_sent'));
            await signOut();
          },
          onError: () => {
            toast.error(t('failed_to_send_reset_email'));
          },
        },
      });

      toast.success(t('password_reset_email_sent'));
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : t('failed_to_send_reset_email');
      toast.error(errorMessage);
    }
  };

  return (
    <div className='space-y-4'>
      <div>
        <h2 className='font-medium text-2xl tracking-tight'>
          {initialHasPassword ? t('change_password') : t('create_a_password')}
        </h2>
        {!initialHasPassword && (
          <p className='mt-2 text-muted-foreground text-sm'>
            {t('password_not_set_description')}
          </p>
        )}
      </div>

      <Form {...form}>
        <form
          className='space-y-4'
          onSubmit={form.handleSubmit(handlePasswordSubmit)}
        >
          {initialHasPassword && (
            <FormField
              control={form.control}
              name='currentPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('current_password')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      required={initialHasPassword}
                      type='password'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name='newPassword'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('new_password')}</FormLabel>
                <FormControl>
                  <Input {...field} type='password' />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='confirmPassword'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('confirm_new_password')}</FormLabel>
                <FormControl>
                  <Input {...field} type='password' />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='flex items-center justify-between'>
            {initialHasPassword && (
              <Button
                className='text-muted-foreground hover:text-foreground'
                onClick={handleForgotPassword}
                type='button'
                variant='ghost'
              >
                {t('forgot_current_password')}
              </Button>
            )}
            <Button
              className={initialHasPassword ? '' : 'ml-auto'}
              disabled={form.formState.isSubmitting}
              type='submit'
            >
              {(() => {
                if (form.formState.isSubmitting) {
                  return initialHasPassword
                    ? t('updating_password')
                    : t('creating_password');
                }
                return initialHasPassword
                  ? t('update_password')
                  : t('create_password');
              })()}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
