'use client';

import { Label } from '@/components/ui/label';
import { encryptPassword } from '@/utils/password';
import { api } from '@/utils/trpc/client';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Sparkle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export default function RegisterPage() {
  const router = useRouter();

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const registerAccount = api.auth.register.useMutation();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    await handlePasswordSignup(formData);
  };

  const handlePasswordSignup = async (formData: FormData) => {
    setLoading(true);

    setError('');

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const hashedPassword = encryptPassword(password);

    await registerAccount.mutateAsync(
      {
        email: email,
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
    <div className='flex min-h-screen items-center justify-center bg-background'>
      <button type='button' onClick={() => window.history.back()} className='absolute top-4 left-4 flex items-center text-neutral-600 hover:text-neutral-800'>
        <ArrowLeft className='h-5 w-5 mr-1' />
        Back
      </button>
      <div className='w-full max-w-md space-y-6 p-8'>
        <div className='flex items-center justify-center'>
          <Sparkle className='h-12 w-12' />
        </div>

        <motion.div key='register-form' initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}>
          <div className='space-y-2 text-center'>
            <h1 className='font-medium text-2xl text-foreground'>Create your account</h1>
            <p className='text-muted-foreground'>Get started with your free Portal account</p>
          </div>

          <form onSubmit={handleSubmit} className='mt-6 space-y-4'>
            {error && <div className='rounded-lg bg-destructive/10 p-3 text-destructive text-sm'>{error}</div>}

            <div className='space-y-1'>
              <Label className='mb-1 block font-medium text-foreground text-sm'>Email</Label>
              <input
                type='email'
                required
                name='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className='w-full rounded-lg border bg-background p-2 focus:outline-none focus:ring-2 focus:ring-neutral-400'
                placeholder='Enter your email'
              />
            </div>

            <div className='space-y-1'>
              <Label className='mb-1 block font-medium text-foreground text-sm'>Password</Label>
              <input
                type='password'
                required
                name='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className='w-full rounded-lg border bg-background p-2 focus:outline-none focus:ring-2 focus:ring-neutral-400'
                placeholder='Create a password'
              />
            </div>

            <div className='space-y-3'>
              <button
                type='submit'
                disabled={loading || !email || !password}
                className='flex w-full items-center justify-center rounded-lg bg-neutral-700 px-4 py-2 font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50'
              >
                {loading ? (
                  <>
                    <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </button>

              <p className='text-center text-muted-foreground text-sm'>
                Already have an account?{' '}
                <a href='/login' className='text-neutral-600 hover:text-neutral-800 hover:underline'>
                  Sign in
                </a>
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
