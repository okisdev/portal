'use client';

import { Banner } from '@/components/shared/banner';
import { Label } from '@/components/ui/label';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const [isPasswordLogin, setIsPasswordLogin] = useState(true);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (isPasswordLogin) {
      await handlePasswordLogin(formData);
    } else {
      await sendMagicLink(formData);
    }
  };

  const handlePasswordLogin = async (formData: FormData) => {
    try {
      setLoading(true);
      setError('');
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
      } else {
        // Redirect or handle successful login
        window.location.href = '/dashboard'; // Or your desired redirect path
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendMagicLink = async (formData: FormData) => {
    try {
      setLoading(true);
      setError('');
      const email = formData.get('email') as string;

      const result = await signIn('resend', {
        email,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
      } else {
        setEmailSent(true);
        setSentEmail(email);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-white'>
      <div className='w-full max-w-md space-y-6 p-8'>
        <div className='flex items-center justify-center'>
          <div className='h-12 w-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-500 shadow-lg' />
        </div>

        <AnimatePresence mode='wait'>
          {!emailSent ? (
            <motion.div key='login-form' initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}>
              <div className='space-y-2 text-center'>
                <h1 className='font-medium text-2xl text-gray-900'>Log in to your account</h1>
                <p className='text-neutral-500'>Welcome back! Please enter your details.</p>
              </div>

              <form onSubmit={handleSubmit} className='mt-6 space-y-4'>
                {error && <Banner title='Error' description={error} variant='error' />}

                <div className='space-y-1'>
                  <Label className='mb-1 flex justify-between font-medium text-gray-700 text-sm'>
                    <span>Email</span>
                    <button type='button' onClick={() => setIsPasswordLogin(!isPasswordLogin)} className='text-blue-500'>
                      {isPasswordLogin ? 'use magic link' : 'use password'}
                    </button>
                  </Label>
                  <input type='email' required name='email' className='w-full rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-400' placeholder='Enter your email' />
                </div>

                {isPasswordLogin && (
                  <div className='space-y-1'>
                    <Label className='mb-1 block font-medium text-gray-700 text-sm'>Password</Label>
                    <input type='password' required name='password' className='w-full rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-400' placeholder='Enter your password' />
                  </div>
                )}

                <div className='flex items-center justify-between'>
                  <label className='flex items-center'>
                    <input type='checkbox' className='h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-400' />
                    <span className='ml-2 text-neutral-500 text-sm'>Remember for 30 days</span>
                  </label>
                  {isPasswordLogin && (
                    <a href='/forgot-password' className='text-blue-500 text-sm hover:text-blue-600'>
                      Forgot password?
                    </a>
                  )}
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
                        {isPasswordLogin ? 'Signing in...' : 'Sending...'}
                      </>
                    ) : isPasswordLogin ? (
                      'Sign in'
                    ) : (
                      'Send Magic Link'
                    )}
                  </button>
                  <p className='text-center text-neutral-500 text-sm'>
                    Don't have an account?{' '}
                    <a href='/register' className='text-blue-500 hover:text-blue-600'>
                      Sign up
                    </a>
                  </p>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key='success-message'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className='space-y-6 text-center'
            >
              <div className='flex justify-center'>
                <CheckCircle2 className='h-12 w-12 text-green-500' />
              </div>
              <div className='space-y-2'>
                <h2 className='font-medium text-2xl text-gray-900'>Check your email</h2>
                <p className='text-neutral-500'>
                  We've sent a magic link to <span className='font-medium text-gray-700'>{sentEmail}</span>
                </p>
              </div>
              <button
                type='button'
                onClick={() => {
                  setEmailSent(false);
                  setSentEmail('');
                }}
                className='text-blue-500 text-sm hover:text-blue-600'
              >
                Use a different email
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
