'use client';

import { Banner } from '@/components/shared/banner';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth.client';
import { api } from '@/utils/trpc/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
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
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const email = watch('email');
  const password = watch('password');

  const [shouldValidate, setShouldValidate] = useState(false);

  const { data: isValidDomain } = api.auth.validateEmailDomain.useQuery({ email: email || '' }, { enabled: shouldValidate && !!email && email.includes('@') });

  useEffect(() => {
    if (email?.includes('@')) {
      setShouldValidate(true);
    }
  }, [email]);

  const handleEmailBlur = () => {
    if (email?.includes('@')) {
      setShouldValidate(true);
    }
  };

  const onSubmit = async (data: LoginFormValues) => {
    if (shouldValidate && isValidDomain === false) {
      setError(t('login_not_allowed_support_only'));
      toast.error(t('login_not_allowed_support_only'));
      return;
    }

    if (isPasswordLogin) {
      await handlePasswordLogin(data);
    }
  };

  const handlePasswordLogin = async (data: LoginFormValues) => {
    try {
      setLoading(true);
      setError('');

      await authClient.signIn.email({
        email: data.email,
        password: data.password ?? '',
      });
    } catch (err) {
      setError(t('unexpected_error'));

      toast.error(t('unexpected_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence mode='wait'>
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
    </AnimatePresence>
  );
}
