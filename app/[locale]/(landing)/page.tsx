'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { redirect, useSearchParams } from 'next/navigation';

export default function Home() {
  const session = useSession();
  const searchParams = useSearchParams();
  const home = searchParams.get('home');

  if (session.status === 'authenticated' && home !== '1') redirect('/dashboard');

  return (
    <div className='min-h-screen bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-800'>
      <div className='relative isolate px-6 pt-14 lg:px-8'>
        <div className='mx-auto max-w-2xl py-32 sm:py-48 lg:py-56'>
          <div className='text-center'>
            <h1 className='font-bold text-4xl text-neutral-900 tracking-tight sm:text-6xl dark:text-white'>Streamline Your Business Operations</h1>
            <p className='mt-6 text-lg text-neutral-600 leading-8 dark:text-neutral-300'>
              Powerful admin dashboard and CRM solution that helps you manage customers, track performance, and grow your business efficiently.
            </p>
            <div className='mt-10 flex items-center justify-center gap-x-6'>
              <Link
                href='/dashboard'
                className='rounded-md bg-neutral-900 px-3.5 py-2.5 font-semibold text-sm text-white shadow-sm hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-900 focus-visible:outline-offset-2 dark:bg-neutral-700 dark:hover:bg-neutral-600'
              >
                Open Dashboard
              </Link>
              <Link href='/demo' className='font-semibold text-neutral-900 text-sm leading-6 dark:text-white'>
                Watch Demo <span aria-hidden='true'>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className='py-24 sm:py-32'>
        <div className='mx-auto max-w-7xl px-6 lg:px-8'>
          <div className='mx-auto max-w-2xl lg:text-center'>
            <h2 className='font-semibold text-base text-neutral-600 leading-7 dark:text-neutral-400'>Complete Solution</h2>
            <p className='mt-2 font-bold text-3xl text-neutral-900 tracking-tight sm:text-4xl dark:text-white'>Everything you need to manage your business</p>
          </div>
          <div className='mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none'>
            <div className='grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3'>
              {[
                {
                  title: 'Customer Management',
                  description: 'Track customer interactions, manage relationships, and boost engagement.',
                  icon: '👥',
                },
                {
                  title: 'Analytics Dashboard',
                  description: 'Real-time insights into sales, customer behavior, and business metrics.',
                  icon: '📊',
                },
                {
                  title: 'Task Automation',
                  description: 'Automate repetitive tasks and streamline your workflow.',
                  icon: '⚡',
                },
              ].map((feature) => (
                <div key={feature.title} className='flex flex-col'>
                  <div className='mb-6 text-4xl'>{feature.icon}</div>
                  <div className='flex flex-auto flex-col'>
                    <h3 className='font-semibold text-neutral-900 text-xl leading-8 tracking-tight dark:text-white'>{feature.title}</h3>
                    <p className='mt-2 text-base text-neutral-600 leading-7 dark:text-neutral-300'>{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className='bg-neutral-50/50 py-24 sm:py-32 dark:bg-neutral-800/50'>
        <div className='mx-auto max-w-7xl px-6 lg:px-8'>
          <div className='mx-auto max-w-xl text-center'>
            <h2 className='font-semibold text-lg text-neutral-600 leading-8 tracking-tight dark:text-neutral-400'>Success Stories</h2>
            <p className='mt-2 font-bold text-3xl text-neutral-900 tracking-tight sm:text-4xl dark:text-white'>Trusted by businesses worldwide</p>
          </div>
          <div className='mx-auto mt-16 flow-root max-w-2xl sm:mt-20 lg:mx-0 lg:max-w-none'>
            <div className='grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3'>
              {[
                {
                  quote: 'This platform has transformed how we manage our customer relationships.',
                  author: 'Sarah Johnson',
                  role: 'Operations Director',
                },
                {
                  quote: 'The analytics dashboard gives us invaluable insights into our business.',
                  author: 'Michael Chen',
                  role: 'Business Owner',
                },
                {
                  quote: 'Task automation saved us countless hours of manual work.',
                  author: 'Emily Rodriguez',
                  role: 'Sales Manager',
                },
              ].map((testimonial) => (
                <div key={testimonial.author} className='rounded-2xl bg-white p-8 text-sm leading-6 shadow-sm dark:bg-neutral-800'>
                  <p className='text-neutral-900 dark:text-white'>"{testimonial.quote}"</p>
                  <div className='mt-6 flex items-center gap-x-4'>
                    <div className='font-semibold text-neutral-900 dark:text-white'>{testimonial.author}</div>
                    <div className='text-neutral-600 dark:text-neutral-400'>{testimonial.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className='relative isolate mt-32 px-6 py-32 sm:mt-56 sm:py-40 lg:px-8'>
        <div className='mx-auto max-w-2xl text-center'>
          <h2 className='font-bold text-3xl text-neutral-900 tracking-tight sm:text-4xl dark:text-white'>Ready to transform your business?</h2>
          <p className='mx-auto mt-6 max-w-xl text-lg text-neutral-600 leading-8 dark:text-neutral-300'>Join thousands of businesses already using our platform to grow and succeed.</p>
          <div className='mt-10 flex items-center justify-center gap-x-6'>
            <Link
              href='/register'
              className='rounded-md bg-neutral-900 px-3.5 py-2.5 font-semibold text-sm text-white shadow-sm hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-900 focus-visible:outline-offset-2 dark:bg-neutral-700 dark:hover:bg-neutral-600'
            >
              Start Free Trial
            </Link>
            <Link href='/contact' className='font-semibold text-neutral-900 text-sm leading-6 dark:text-white'>
              Contact Sales <span aria-hidden='true'>→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
