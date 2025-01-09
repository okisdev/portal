'use client';

import { signIn } from '@/auth';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid credentials');
        return;
      }

      router.push('/dashboard');
    } catch (error) {
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLinkSignIn = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    try {
      setLoading(true);
      setError(null);

      const result = await signIn('resend', {
        email,
        redirect: false,
      });

      if (result?.error) {
        setError('Failed to send magic link');
        return;
      }

      // Show success message or handle accordingly
      setError('Magic link has been sent to your email');
    } catch (error) {
      setError('An error occurred while sending magic link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50'>
      <div className='w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg'>
        <div className='text-center'>
          <h2 className='mt-6 font-bold text-3xl text-gray-900'>Welcome back</h2>
          <p className='mt-2 text-gray-600 text-sm'>Please sign in to your account</p>
        </div>

        <form className='mt-8 space-y-6' onSubmit={handleSubmit}>
          <div className='space-y-4 rounded-md shadow-sm'>
            <div>
              <label htmlFor='email' className='sr-only'>
                Email address
              </label>
              <input
                id='email'
                name='email'
                type='email'
                autoComplete='email'
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className='relative block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm'
                placeholder='Email address'
              />
            </div>
            <div>
              <label htmlFor='password' className='sr-only'>
                Password
              </label>
              <input
                id='password'
                name='password'
                type='password'
                autoComplete='current-password'
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className='relative block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm'
                placeholder='Password'
              />
            </div>
          </div>

          {error && <div className='text-center text-red-500 text-sm'>{error}</div>}

          <div className='flex items-center justify-between'>
            <div className='flex items-center'>
              <input id='remember-me' name='remember-me' type='checkbox' className='h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500' />
              <label htmlFor='remember-me' className='ml-2 block text-gray-900 text-sm'>
                Remember me
              </label>
            </div>

            <div className='text-sm'>
              <Link href='#' className='font-medium text-indigo-600 hover:text-indigo-500'>
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type='submit'
              disabled={loading}
              className='group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 font-medium text-sm text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
            >
              {loading ? <span className='flex items-center'>Signing in...</span> : 'Sign in'}
            </button>
          </div>
        </form>

        <div className='mt-6'>
          <div className='relative'>
            <div className='absolute inset-0 flex items-center'>
              <div className='w-full border-gray-300 border-t' />
            </div>
            <div className='relative flex justify-center text-sm'>
              <span className='bg-white px-2 text-gray-500'>Or continue with</span>
            </div>
          </div>

          <div className='mt-6 grid grid-cols-1 gap-3'>
            <button
              type='button'
              onClick={handleMagicLinkSignIn}
              className='inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-500 text-sm shadow-sm hover:bg-gray-50'
            >
              <span className='sr-only'>Sign in with Magic Link</span>
            </button>
          </div>
        </div>

        <p className='mt-8 text-center text-gray-600 text-sm'>
          Don't have an account?{' '}
          <a href='/register' className='font-medium text-indigo-600 hover:text-indigo-500'>
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
