'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { api } from '@/utils/trpc/client';

const emailUpdateSchema = z
  .object({
    newEmail: z.string().email('Please enter a valid email address'),
    confirmEmail: z.string().email('Please enter a valid email address'),
  })
  .refine((data) => data.newEmail === data.confirmEmail, {
    message: 'Email addresses do not match',
    path: ['confirmEmail'],
  });

type EmailUpdateFormValues = z.infer<typeof emailUpdateSchema>;

interface EmailUpdateDialogProps {
  open: boolean;
  currentEmail?: string;
  onOpenChange: (open: boolean) => void;
  onEmailUpdate?: (newEmail: string) => void;
}

export function EmailUpdateDialog({
  open,
  currentEmail = '',
  onOpenChange,
  onEmailUpdate,
}: EmailUpdateDialogProps) {
  const t = useTranslations();
  const updateAccount = api.account.updateMe.useMutation();

  const form = useForm<EmailUpdateFormValues>({
    resolver: zodResolver(emailUpdateSchema),
    defaultValues: {
      newEmail: '',
      confirmEmail: '',
    },
  });

  useEffect(() => {
    if (open) {
      // Reset form when dialog opens
      form.reset({
        newEmail: '',
        confirmEmail: '',
      });
    }
  }, [open, form]);

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      form.reset();
    }
  };

  const onSubmit = async (data: EmailUpdateFormValues) => {
    // Check if email has actually changed
    if (data.newEmail === currentEmail) {
      handleOpenChange(false);
      return;
    }

    try {
      await updateAccount.mutateAsync(
        {
          email: data.newEmail,
        },
        {
          onSuccess: () => {
            if (onEmailUpdate) {
              onEmailUpdate(data.newEmail);
            }
            handleOpenChange(false);
            toast.success(t('account_updated_successfully'));
          },
          onError: (error) => {
            if (error.message.includes('already exists')) {
              form.setError('newEmail', {
                type: 'manual',
                message: t('email_already_exists'),
              });
            } else {
              toast.error(t('failed_to_update_account'));
            }
          },
        }
      );
    } catch (error) {
      console.error('Failed to update email:', error);
    }
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('update_email_address')}</DialogTitle>
          <DialogDescription>
            {t('update_email_address_description')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className='space-y-4 py-4'
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name='newEmail'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('new_email')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t('enter_new_email')}
                      type='email'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='confirmEmail'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('confirm_new_email')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t('confirm_new_email')}
                      type='email'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                onClick={() => handleOpenChange(false)}
                type='button'
                variant='outline'
              >
                {t('cancel')}
              </Button>
              <Button
                disabled={
                  form.formState.isSubmitting || !form.formState.isValid
                }
                type='submit'
              >
                {form.formState.isSubmitting
                  ? t('updating')
                  : t('update_email')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
