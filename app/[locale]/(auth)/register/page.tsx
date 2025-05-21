'use client';

import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth.client';
import { api } from '@/utils/trpc/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const t = useTranslations();

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const email = watch('email');
  const password = watch('password');
  const firstName = watch('firstName');
  const lastName = watch('lastName');

  const [shouldValidate, setShouldValidate] = useState(false);

  const registerMutation = api.auth.register.useMutation();

  const { data: isValidDomain } = api.auth.validateEmailDomain.useQuery({ email: email || '' }, { enabled: shouldValidate && !!email && email.includes('@') });

  const handleEmailBlur = () => {
    if (email?.includes('@')) {
      setShouldValidate(true);
    }
  };

  const onSubmit = async (data: RegisterFormValues) => {
    if (!isValidDomain) {
      setError(t('registration_not_allowed_support_only'));
      toast.error(t('registration_not_allowed_support_only'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      // First register with auth client
      await authClient.signUp.email(
        {
          email: data.email,
          password: data.password,
          name: `${data.firstName} ${data.lastName}`,
          callbackURL: '/dashboard',
        },
        {
          onRequest: () => {
            setLoading(true);
          },
          onSuccess: async () => {
            // Then update additional data with TRPC
            try {
              await registerMutation.mutateAsync({
                email: data.email,
                password: data.password,
                firstName: data.firstName,
                lastName: data.lastName,
              });

              toast.success(t('registration_successful'));
              router.push('/login?from=register&type=success');
            } catch (error: any) {
              setError(error?.message || t('unexpected_error'));
              toast.error(error?.message || t('unexpected_error'));
            }
          },
          onError: (ctx) => {
            setError(ctx.error.message || t('unexpected_error'));
            toast.error(ctx.error.message || t('unexpected_error'));
          },
        }
      );
    } catch (error: any) {
      setError(error?.message || t('unexpected_error'));
      toast.error(error?.message || t('unexpected_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div key='register-form' initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}>
      <div className='space-y-2 text-center'>
        <h1 className='font-medium text-foreground text-lg md:text-2xl'>{t('sign_up_title')}</h1>
        <p className='text-muted-foreground text-sm md:text-base'>{t('sign_up_description')}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className='mt-6 space-y-4'>
        {error && <div className='rounded-lg bg-destructive/10 p-3 text-destructive text-sm'>{error}</div>}

        <div className='space-y-1'>
          <Label className='mb-1 block font-medium text-foreground text-sm'>{t('email')}</Label>
          <input
            type='email'
            {...register('email')}
            onBlur={handleEmailBlur}
            className='w-full rounded-lg border bg-background p-2 focus:outline-hidden focus:ring-2 focus:ring-ring'
            placeholder={t('email_placeholder')}
          />
          {errors.email && <p className='mt-1 text-destructive text-sm'>{errors.email.message}</p>}
        </div>

        <div className='grid grid-cols-2 gap-4'>
          <div className='space-y-1'>
            <Label className='mb-1 block font-medium text-foreground text-sm'>{t('first_name')}</Label>
            <input type='text' {...register('firstName')} className='w-full rounded-lg border bg-background p-2 focus:outline-hidden focus:ring-2 focus:ring-ring' placeholder={t('first_name')} />
            {errors.firstName && <p className='mt-1 text-destructive text-sm'>{errors.firstName.message}</p>}
          </div>

          <div className='space-y-1'>
            <Label className='mb-1 block font-medium text-foreground text-sm'>{t('last_name')}</Label>
            <input type='text' {...register('lastName')} className='w-full rounded-lg border bg-background p-2 focus:outline-hidden focus:ring-2 focus:ring-ring' placeholder={t('last_name')} />
            {errors.lastName && <p className='mt-1 text-destructive text-sm'>{errors.lastName.message}</p>}
          </div>
        </div>

        <div className='space-y-1'>
          <Label className='mb-1 block font-medium text-foreground text-sm'>{t('password')}</Label>
          <input
            type='password'
            {...register('password')}
            className='w-full rounded-lg border bg-background p-2 focus:outline-hidden focus:ring-2 focus:ring-ring'
            placeholder={t('create_a_password')}
          />
          {errors.password && <p className='mt-1 text-destructive text-sm'>{errors.password.message}</p>}
        </div>

        <div className='space-y-3'>
          <button
            type='submit'
            disabled={loading || !email || !password || !firstName || !lastName}
            className='flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-50'
          >
            {loading ? (
              <>
                <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                {t('creating_account')}
              </>
            ) : (
              t('create_account')
            )}
          </button>

          <p className='text-center text-muted-foreground text-sm'>
            {t('already_have_an_account')}{' '}
            <Link href='/login' className='text-muted-foreground underline hover:text-foreground'>
              {t('sign_in')}
            </Link>
          </p>
        </div>
      </form>
    </motion.div>
  );
}
