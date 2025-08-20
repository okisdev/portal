'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod/v4';
import { Banner } from '@/components/shared/banner';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth.client';
import { api } from '@/utils/trpc/client';

const forgotPasswordSchema = z.object({
  email: z.email('Please enter a valid email'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const t = useTranslations();

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const email = watch('email');

  const [emailToValidate, setEmailToValidate] = useState<string>('');

  const { data: isValidDomain } = api.auth.validateEmailDomain.useQuery(
    { email: emailToValidate },
    { enabled: !!emailToValidate }
  );

  const isValidEmailFormat = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailBlur = () => {
    if (email && isValidEmailFormat(email)) {
      setEmailToValidate(email);
    }
  };

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    if (emailToValidate && isValidDomain === false) {
      setError(t('password_reset_not_allowed_support_only'));
      toast.error(t('password_reset_not_allowed_support_only'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authClient.forgetPassword(
        {
          email: data.email,
          redirectTo: '/reset-password',
        },
        {
          onSuccess: () => {
            setEmailSent(true);
            setSentEmail(data.email);
          },
          onError: (ctx) => {
            setError(ctx.error.message || t('unexpected_error'));
          },
        }
      );

      toast.success(t('password_reset_email_sent'));
    } catch (err: any) {
      setError(err.message || t('unexpected_error'));
      toast.error(err.message || t('unexpected_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence mode='wait'>
      {emailSent ? (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className='space-y-6 text-center'
          exit={{ opacity: 0, y: -20 }}
          initial={{ opacity: 0, y: 20 }}
          key='success-message'
          transition={{ duration: 0.2 }}
        >
          <div className='flex justify-center'>
            <CheckCircle2 className='h-12 w-12 text-green-500' />
          </div>
          <div className='space-y-2'>
            <h2 className='font-medium text-2xl text-foreground'>
              {t('check_your_email')}
            </h2>
            <p className='text-muted-foreground'>
              {t('password_reset_email_sent_to')}{' '}
              <span className='font-medium text-foreground'>{sentEmail}</span>
            </p>
          </div>
          <button
            className='text-muted-foreground text-sm hover:text-foreground'
            onClick={() => {
              setEmailSent(false);
              setSentEmail('');
            }}
            type='button'
          >
            {t('use_different_email')}
          </button>
        </motion.div>
      ) : (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          initial={{ opacity: 0, y: 20 }}
          key='forgot-password-form'
          transition={{ duration: 0.2 }}
        >
          <div className='space-y-2 text-center'>
            <h1 className='font-medium text-foreground text-lg md:text-2xl'>
              {t('forgot_password_title')}
            </h1>
            <p className='text-muted-foreground text-sm md:text-base'>
              {t('forgot_password_description')}
            </p>
          </div>

          <form className='mt-6 space-y-4' onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <Banner description={error} title={t('error')} variant='error' />
            )}

            <div className='space-y-1'>
              <Label className='mb-1 block font-medium text-foreground text-sm'>
                {t('email')}
              </Label>
              <input
                type='email'
                {...register('email')}
                className='w-full rounded-lg border bg-background p-2 focus:outline-hidden focus:ring-2 focus:ring-ring'
                onBlur={handleEmailBlur}
                placeholder={t('email_placeholder')}
              />
              {errors.email && (
                <p className='mt-1 text-destructive text-sm'>
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className='space-y-3'>
              <button
                className='flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-50'
                disabled={loading || !email}
                type='submit'
              >
                {loading ? (
                  <>
                    <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                    {t('sending')}
                  </>
                ) : (
                  t('send_reset_link')
                )}
              </button>

              <div className='flex items-center justify-center space-x-4 text-center text-muted-foreground text-sm'>
                <Link
                  className='flex items-center text-muted-foreground hover:text-foreground'
                  href='/login'
                >
                  <ArrowLeft className='mr-1 h-4 w-4' />
                  {t('back_to_login')}
                </Link>
              </div>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
