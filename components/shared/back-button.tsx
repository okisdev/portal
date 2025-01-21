'use client';

import { ArrowLeft } from 'lucide-react';

export function BackButton() {
  return (
    <button type='button' onClick={() => window.history.back()} className='absolute top-4 left-4 flex items-center text-neutral-600 hover:text-neutral-800'>
      <ArrowLeft className='mr-1 h-5 w-5' />
      Back
    </button>
  );
}
