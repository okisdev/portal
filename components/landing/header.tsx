'use client';

import { Menu, Sparkle, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const navigation = [
  { name: 'Features', href: '#features' },
  { name: 'Pricing', href: '/pricing' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className='fixed inset-x-0 top-0 z-50 bg-white/80 backdrop-blur-sm dark:bg-neutral-900/80'>
      <nav className='flex items-center justify-between p-4 lg:px-8' aria-label='Global'>
        <div className='flex lg:flex-1'>
          <Link href='/' className='-m-1.5 p-1.5'>
            <span className='sr-only'>Portal</span>
            <div className='flex items-center gap-2'>
              <Sparkle className='h-6 w-6' />
              <span className='font-semibold text-lg text-neutral-900 dark:text-white'>Portal</span>
            </div>
          </Link>
        </div>
        <div className='flex lg:hidden'>
          <button type='button' className='-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-neutral-700 dark:text-neutral-300' onClick={() => setMobileMenuOpen(true)}>
            <span className='sr-only'>Open main menu</span>
            <Menu className='h-6 w-6' aria-hidden='true' />
          </button>
        </div>
        <div className='hidden lg:flex lg:gap-x-12'>
          {navigation.map((item) => (
            <Link key={item.name} href={item.href} className='font-semibold text-neutral-900 text-sm leading-6 hover:text-neutral-600 dark:text-neutral-300 dark:hover:text-white'>
              {item.name}
            </Link>
          ))}
        </div>
        <div className='hidden items-center lg:flex lg:flex-1 lg:justify-end lg:gap-x-4'>
          <Link href='/login' className='font-semibold text-neutral-900 text-sm leading-6 hover:text-neutral-600 dark:text-neutral-300 dark:hover:text-white'>
            Log in
          </Link>
          <Link
            href='/register'
            className='rounded-md bg-neutral-900 px-3 py-2 font-semibold text-sm text-white shadow-sm hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-900 focus-visible:outline-offset-2 dark:bg-neutral-700 dark:hover:bg-neutral-600'
          >
            Sign up
          </Link>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className='fixed inset-0 z-50 lg:hidden'>
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
          <div className='fixed inset-0 bg-black/20 backdrop-blur-sm dark:bg-neutral-900/80' aria-hidden='true' onClick={() => setMobileMenuOpen(false)} />

          <div className='fixed inset-y-0 right-0 z-50 w-full bg-white sm:max-w-sm sm:ring-1 sm:ring-neutral-900/10 dark:bg-neutral-900 dark:sm:ring-neutral-800'>
            <div className='flex items-center justify-between px-4 py-4'>
              <Link href='/' className='-m-1.5 p-1.5' onClick={() => setMobileMenuOpen(false)}>
                <span className='sr-only'>Portal</span>
                <div className='flex items-center gap-2'>
                  <Sparkle className='h-6 w-6' />
                  <span className='font-semibold text-lg text-neutral-900 dark:text-white'>Portal</span>
                </div>
              </Link>
              <button type='button' className='-m-2.5 rounded-md p-2.5 text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white' onClick={() => setMobileMenuOpen(false)}>
                <span className='sr-only'>Close menu</span>
                <X className='h-6 w-6' aria-hidden='true' />
              </button>
            </div>

            <div className='flex h-[calc(100vh-4rem)] flex-col justify-between bg-white px-4 pb-6 dark:bg-neutral-900'>
              <div className='divide-y divide-neutral-200 dark:divide-neutral-800'>
                <div className='space-y-2 py-6'>
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className='-mx-3 flex items-center rounded-lg px-3 py-2 font-semibold text-base text-neutral-900 leading-7 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800'
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>

              <div className='flex w-full items-center justify-between pt-6'>
                <Link
                  href='/login'
                  className='block rounded-lg px-3 py-2.5 font-semibold text-base text-neutral-900 leading-7 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800'
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  href='/register'
                  className='block w-8/12 rounded-lg bg-neutral-900 px-3 py-2.5 font-semibold text-base text-white leading-7 hover:bg-neutral-800 dark:bg-neutral-700 dark:hover:bg-neutral-600'
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign up
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
