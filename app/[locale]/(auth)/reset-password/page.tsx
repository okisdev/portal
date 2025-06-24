'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod/v4';
import { Banner } from '@/components/shared/banner';
import { Label } from '@/components/ui/label';
import { encryptPassword } from '@/utils/password';
import { api } from '@/utils/trpc/client';

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
  });

  const password = watch('password');
  const confirmPassword = watch('confirmPassword');

  const resetPassword = api.auth.resetPassword.useMutation();

  useEffect(() => {
    const emailFromUrl = searchParams.get('email');
    if (emailFromUrl) {
      setEmail(emailFromUrl);
    } else {
      // If no email in URL, redirect to forgot password page
      router.push('/forgot-password');
    }
  }, [searchParams, router]);

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!email) {
      setError(t('invalid_reset_link'));
      toast.error(t('invalid_reset_link'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const hashedPassword = encryptPassword(data.password);

      await resetPassword.mutateAsync({
        email,
        password: hashedPassword,
      });

      setSuccess(true);
      toast.success(t('password_reset_successful'));

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login?from=reset-password&type=success');
      }, 2000);
    } catch (err: any) {
      setError(err.message || t('unexpected_error'));
      toast.error(err.message || t('unexpected_error'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className='space-y-6 text-center'
      >
        <div className='flex justify-center'>
          <CheckCircle2 className='h-12 w-12 text-green-500' />
        </div>
        <div className='space-y-2'>
          <h2 className='font-medium text-2xl text-foreground'>
            {t('password_reset_successful')}
          </h2>
          <p className='text-muted-foreground'>
            {t('password_reset_success_description')}
          </p>
        </div>
        <div className='text-muted-foreground text-sm'>
          {t('redirecting_to_login')}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className='space-y-2 text-center'>
        <h1 className='font-medium text-foreground text-lg md:text-2xl'>
          {t('reset_password_title')}
        </h1>
        <p className='text-muted-foreground text-sm md:text-base'>
          {t('reset_password_description')}
        </p>
        {email && (
          <p className='text-muted-foreground text-sm'>
            {t('resetting_password_for')}{' '}
            <span className='font-medium text-foreground'>{email}</span>
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className='mt-6 space-y-4'>
        {error && (
          <Banner title={t('error')} description={error} variant='error' />
        )}

        <div className='space-y-1'>
          <Label className='mb-1 block font-medium text-foreground text-sm'>
            {t('new_password')}
          </Label>
          <input
            type='password'
            {...register('password')}
            className='w-full rounded-lg border bg-background p-2 focus:outline-hidden focus:ring-2 focus:ring-ring'
            placeholder={t('enter_new_password')}
          />
          {errors.password && (
            <p className='mt-1 text-destructive text-sm'>
              {errors.password.message}
            </p>
          )}
        </div>

        <div className='space-y-1'>
          <Label className='mb-1 block font-medium text-foreground text-sm'>
            {t('confirm_password')}
          </Label>
          <input
            type='password'
            {...register('confirmPassword')}
            className='w-full rounded-lg border bg-background p-2 focus:outline-hidden focus:ring-2 focus:ring-ring'
            placeholder={t('confirm_new_password')}
          />
          {errors.confirmPassword && (
            <p className='mt-1 text-destructive text-sm'>
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <div className='space-y-3'>
          <button
            type='submit'
            disabled={loading || !password || !confirmPassword}
            className='flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-50'
          >
            {loading ? (
              <>
                <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                {t('updating_password')}
              </>
            ) : (
              t('update_password')
            )}
          </button>

          <div className='flex items-center justify-center space-x-4 text-center text-muted-foreground text-sm'>
            <Link
              href='/login'
              className='flex items-center text-muted-foreground hover:text-foreground'
            >
              <ArrowLeft className='mr-1 h-4 w-4' />
              {t('back_to_login')}
            </Link>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
