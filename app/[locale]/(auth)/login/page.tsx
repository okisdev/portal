'use client';

import { Banner } from '@/components/shared/banner';
import { Label } from '@/components/ui/label';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { signIn } from 'next-auth/react';
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

  const onSubmit = async (data: LoginFormValues) => {
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
        setError(result.error);
        toast.error(result.error);
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      toast.error('Something went wrong. Please try again.');
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
      setError('Something went wrong. Please try again.');
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence mode='wait'>
      {!emailSent ? (
        <motion.div key='login-form' initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}>
          <div className='space-y-2 text-center'>
            <h1 className='font-medium text-foreground text-lg md:text-2xl'>Log in to your Portal account</h1>
            <p className='text-muted-foreground text-sm md:text-base'>Welcome back! Please enter your details.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className='mt-6 space-y-4'>
            {error && <Banner title='Error' description={error} variant='error' />}

            <div className='space-y-1'>
              <Label className='mb-1 flex justify-between font-medium text-foreground text-sm'>
                <span>Email</span>
                <button type='button' onClick={() => setIsPasswordLogin(!isPasswordLogin)} className='text-muted-foreground text-sm hover:text-foreground'>
                  {isPasswordLogin ? 'use magic link' : 'use password'}
                </button>
              </Label>
              <input type='email' {...register('email')} className='w-full rounded-lg border bg-background p-2 focus:outline-hidden focus:ring-2 focus:ring-ring' placeholder='Enter your email' />
              {errors.email && <p className='mt-1 text-destructive text-sm'>{errors.email.message}</p>}
            </div>

            {isPasswordLogin && (
              <div className='space-y-1'>
                <Label className='mb-1 block font-medium text-foreground text-sm'>Password</Label>
                <input
                  type='password'
                  {...register('password')}
                  className='w-full rounded-lg border bg-background p-2 focus:outline-hidden focus:ring-2 focus:ring-ring'
                  placeholder='Enter your password'
                />
                {errors.password && <p className='mt-1 text-destructive text-sm'>{errors.password.message}</p>}
              </div>
            )}

            <div className='flex items-center justify-between'>
              <label className='flex items-center'>
                <input type='checkbox' className='h-3 w-3 rounded border-input text-primary accent-primary focus:ring-ring focus:ring-offset-0' />
                <span className='ml-2 text-muted-foreground text-sm'>Remember for 30 days</span>
              </label>
              {isPasswordLogin && (
                <a href='/forgot-password' className='text-muted-foreground text-sm hover:text-foreground hover:underline'>
                  Forgot password?
                </a>
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
                    {isPasswordLogin ? 'Signing in...' : 'Sending...'}
                  </>
                ) : isPasswordLogin ? (
                  'Sign in'
                ) : (
                  'Send Magic Link'
                )}
              </button>
              <p className='text-center text-muted-foreground text-sm'>
                Don't have an account?{' '}
                <a href='/register' className='text-muted-foreground underline hover:text-foreground'>
                  Sign up
                </a>
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
