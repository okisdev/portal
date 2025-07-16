'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod/v4';
import { Label } from '@/components/ui/label';
import { encryptPassword } from '@/utils/password';
import { api } from '@/utils/trpc/client';

const registerSchema = z.object({
  email: z.email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
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

  const registerAccount = api.auth.register.useMutation();
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

  const onSubmit = async (data: RegisterFormValues) => {
    if (!isValidDomain) {
      setError(t('registration_not_allowed_support_only'));
      toast.error(t('registration_not_allowed_support_only'));
      return;
    }

    setLoading(true);
    setError('');

    const hashedPassword = encryptPassword(data.password);

    await registerAccount.mutateAsync(
      {
        email: data.email,
        password: hashedPassword,
      },
      {
        onSuccess: () => {
          toast.success(t('registration_successful'));
          router.push('/login?from=register&type=success');
        },
        onError: (error) => {
          setError(error.message || t('unexpected_error'));
          toast.error(error.message || t('unexpected_error'));
        },
      }
    );

    setLoading(false);
  };

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      initial={{ opacity: 0, y: 20 }}
      key='register-form'
      transition={{ duration: 0.2 }}
    >
      <div className='space-y-2 text-center'>
        <h1 className='font-medium text-foreground text-lg md:text-2xl'>
          {t('sign_up_title')}
        </h1>
        <p className='text-muted-foreground text-sm md:text-base'>
          {t('sign_up_description')}
        </p>
      </div>

      <form className='mt-6 space-y-4' onSubmit={handleSubmit(onSubmit)}>
        {error && (
          <div className='rounded-lg bg-destructive/10 p-3 text-destructive text-sm'>
            {error}
          </div>
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

        <div className='space-y-1'>
          <Label className='mb-1 block font-medium text-foreground text-sm'>
            {t('password')}
          </Label>
          <input
            type='password'
            {...register('password')}
            className='w-full rounded-lg border bg-background p-2 focus:outline-hidden focus:ring-2 focus:ring-ring'
            placeholder={t('create_a_password')}
          />
          {errors.password && (
            <p className='mt-1 text-destructive text-sm'>
              {errors.password.message}
            </p>
          )}
        </div>

        <div className='space-y-3'>
          <button
            className='flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-50'
            disabled={loading || !email || !password}
            type='submit'
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
            <Link
              className='text-muted-foreground underline hover:text-foreground'
              href='/login'
            >
              {t('sign_in')}
            </Link>
          </p>
        </div>
      </form>
    </motion.div>
  );
}
