'use client';

import { Label } from '@/components/ui/label';
import { encryptPassword } from '@/utils/password';
import { api } from '@/utils/trpc/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email'),
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
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const email = watch('email');
  const password = watch('password');

  const registerAccount = api.auth.register.useMutation();

  const onSubmit = async (data: RegisterFormValues) => {
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
          toast.success('Registration successful!');
          router.push('/dashboard');
        },
        onError: (error) => {
          setError(error.message || 'Something went wrong. Please try again.');
          toast.error(error.message || 'Something went wrong. Please try again.');
        },
      }
    );

    setLoading(false);
  };

  return (
    <motion.div key='register-form' initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}>
      <div className='space-y-2 text-center'>
        <h1 className='font-medium text-foreground text-lg md:text-2xl'>Create your account</h1>
        <p className='text-muted-foreground text-sm md:text-base'>Get started with your free Portal account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className='mt-6 space-y-4'>
        {error && <div className='rounded-lg bg-destructive/10 p-3 text-destructive text-sm'>{error}</div>}

        <div className='space-y-1'>
          <Label className='mb-1 block font-medium text-foreground text-sm'>{t('email')}</Label>
          <input type='email' {...register('email')} className='w-full rounded-lg border bg-background p-2 focus:outline-none focus:ring-2 focus:ring-ring' placeholder='Enter your email' />
          {errors.email && <p className='mt-1 text-destructive text-sm'>{errors.email.message}</p>}
        </div>

        <div className='space-y-1'>
          <Label className='mb-1 block font-medium text-foreground text-sm'>{t('password')}</Label>
          <input
            type='password'
            {...register('password')}
            className='w-full rounded-lg border bg-background p-2 focus:outline-none focus:ring-2 focus:ring-ring'
            placeholder={t('create_a_password')}
          />
          {errors.password && <p className='mt-1 text-destructive text-sm'>{errors.password.message}</p>}
        </div>

        <div className='space-y-3'>
          <button
            type='submit'
            disabled={loading || !email || !password}
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
            Already have an account?{' '}
            <a href='/login' className='text-muted-foreground underline hover:text-foreground'>
              {t('sign_in')}
            </a>
          </p>
        </div>
      </form>
    </motion.div>
  );
}
