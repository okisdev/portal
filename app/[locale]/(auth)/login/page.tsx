'use client';

import { Banner } from '@/components/shared/banner';
import { Label } from '@/components/ui/label';
import { api } from '@/utils/trpc/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const t = useTranslations();

  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const type = searchParams.get('type');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const [isPasswordLogin, setIsPasswordLogin] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const email = watch('email');
  const password = watch('password');

  const [shouldValidate, setShouldValidate] = useState(false);

  const { data: isValidDomain } = api.auth.validateEmailDomain.useQuery({ email: email || '' }, { enabled: shouldValidate && !!email && email.includes('@') });

  const handleEmailBlur = () => {
    if (email?.includes('@')) {
      setShouldValidate(true);
    }
  };

  const onSubmit = async (data: LoginFormValues) => {
    if (!isValidDomain) {
      setError(t('login_not_allowed_support_only'));
      toast.error(t('login_not_allowed_support_only'));
      return;
    }

    if (isPasswordLogin) {
      await handlePasswordLogin(data);
    } else {
      await sendMagicLink(data);
    }
  };

  const handlePasswordLogin = async (data: LoginFormValues) => {
    try {
      setLoading(true);
      setError('');

      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        let errorMessage = t('unexpected_error');

        switch (result.code) {
          case 'user_not_found':
            errorMessage = t('user_not_found_error');
            break;
          case 'password_incorrect':
            errorMessage = t('password_incorrect_error');
            break;
          case 'user_or_password_incorrect':
            errorMessage = t('user_or_password_incorrect_error');
            break;
          case 'unexpected_error':
            errorMessage = t('unexpected_error');
            break;
        }

        setError(errorMessage);
        toast.error(errorMessage);
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError(t('unexpected_error'));

      toast.error(t('unexpected_error'));
    } finally {
      setLoading(false);
    }
  };

  const sendMagicLink = async (data: LoginFormValues) => {
    try {
      setLoading(true);
      setError('');

      const result = await signIn('resend', {
        email: data.email,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
      } else {
        setEmailSent(true);
        setSentEmail(data.email);
      }
    } catch (err) {
      setError(t('unexpected_error'));
      toast.error(t('unexpected_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence mode='wait'>
      {!emailSent ? (
        <motion.div key='login-form' initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}>
          <div className='space-y-2 text-center'>
            <h1 className='font-medium text-foreground text-lg md:text-2xl'>{t('login_title')}</h1>
            <p className='text-muted-foreground text-sm md:text-base'>{t('login_description')}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className='mt-6 space-y-4'>
            {from === 'register' && type === 'success' && <Banner title={t('registration_successful')} description={t('please_login_to_continue')} variant='success' />}
            {error && <Banner title={t('error')} description={error} variant='error' />}

            <div className='space-y-1'>
              <Label className='mb-1 flex justify-between font-medium text-foreground text-sm'>
                <span>{t('email')}</span>
                <button type='button' onClick={() => setIsPasswordLogin(!isPasswordLogin)} className='text-muted-foreground text-sm hover:text-foreground'>
                  {isPasswordLogin ? t('use_magic_link') : t('use_password')}
                </button>
              </Label>
              <input
                type='email'
                {...register('email')}
                onBlur={handleEmailBlur}
                className='w-full rounded-lg border bg-background p-2 focus:outline-hidden focus:ring-2 focus:ring-ring'
                placeholder={t('email_placeholder')}
              />
              {errors.email && <p className='mt-1 text-destructive text-sm'>{errors.email.message}</p>}
            </div>

            {isPasswordLogin && (
              <div className='space-y-1'>
                <Label className='mb-1 block font-medium text-foreground text-sm'>{t('password')}</Label>
                <input
                  type='password'
                  {...register('password')}
                  className='w-full rounded-lg border bg-background p-2 focus:outline-hidden focus:ring-2 focus:ring-ring'
                  placeholder={t('password_placeholder')}
                />
                {errors.password && <p className='mt-1 text-destructive text-sm'>{errors.password.message}</p>}
              </div>
            )}

            <div className='flex items-center justify-between'>
              <label className='flex items-center'>
                <input type='checkbox' className='h-3 w-3 rounded border-input text-primary accent-primary focus:ring-ring focus:ring-offset-0' />
                <span className='ml-2 text-muted-foreground text-sm'>{t('remember_for_30_days')}</span>
              </label>
              {isPasswordLogin && (
                <Link href='/forgot-password' className='text-muted-foreground text-sm hover:text-foreground hover:underline'>
                  {t('forgot_password')}
                </Link>
              )}
            </div>

            <div className='space-y-3'>
              <button
                type='submit'
                disabled={loading || !email || (isPasswordLogin && !password)}
                className='flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-50'
              >
                {loading ? (
                  <>
                    <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                    {isPasswordLogin ? t('signing_in') : t('sending')}
                  </>
                ) : isPasswordLogin ? (
                  t('sign_in')
                ) : (
                  t('send_magic_link')
                )}
              </button>
              <p className='text-center text-muted-foreground text-sm'>
                {t('dont_have_an_account')}{' '}
                <Link href='/register' className='text-muted-foreground underline hover:text-foreground'>
                  {t('sign_up')}
                </Link>
              </p>
            </div>
          </form>
        </motion.div>
      ) : (
        <motion.div key='success-message' initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }} className='space-y-6 text-center'>
          <div className='flex justify-center'>
            <CheckCircle2 className='h-12 w-12 text-green-500' />
          </div>
          <div className='space-y-2'>
            <h2 className='font-medium text-2xl text-foreground'>Check your email</h2>
            <p className='text-muted-foreground'>
              We've sent a magic link to <span className='font-medium text-foreground'>{sentEmail}</span>
            </p>
          </div>
          <button
            type='button'
            onClick={() => {
              setEmailSent(false);
              setSentEmail('');
            }}
            className='text-muted-foreground text-sm hover:text-foreground'
          >
            Use a different email
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
