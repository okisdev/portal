'use client';

import { Label } from '@/components/ui/label';
import { encryptPassword } from '@/utils/password';
import { api } from '@/utils/trpc/client';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export default function RegisterPage() {
  const router = useRouter();

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div className='flex min-h-screen items-center justify-center bg-white'>
      <div className='w-full max-w-md space-y-6 p-8'>
        <div className='flex items-center justify-center'>
          <div className='h-12 w-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-500 shadow-lg' />
        </div>

        <motion.div key='register-form' initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}>
          <div className='space-y-2 text-center'>
            <h1 className='font-semibold text-2xl text-gray-900'>Create your account</h1>
            <p className='text-gray-500'>Get started with your free account</p>
          </div>

          <form onSubmit={handleSubmit} className='mt-6 space-y-4'>
            {error && <div className='rounded-lg bg-red-50 p-3 text-red-400 text-sm'>{error}</div>}

            <div className='space-y-1'>
              <Label className='mb-1 block font-medium text-gray-700 text-sm'>Email</Label>
              <input type='email' required name='email' className='w-full rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-400' placeholder='Enter your email' />
            </div>

            <div className='space-y-1'>
              <Label className='mb-1 block font-medium text-gray-700 text-sm'>Password</Label>
              <input type='password' required name='password' className='w-full rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-400' placeholder='Create a password' />
            </div>

            <div className='space-y-3'>
              <button
                type='submit'
                disabled={loading}
                className='flex w-full items-center justify-center rounded-lg bg-blue-500 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50'
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

              <p className='text-center text-gray-500 text-sm'>
                Already have an account?{' '}
                <a href='/login' className='text-blue-500 hover:text-blue-600'>
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
