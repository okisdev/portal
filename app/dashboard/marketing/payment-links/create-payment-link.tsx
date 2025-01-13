'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export function CreatePaymentLink() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const amount = formData.get('amount') as string;

    try {
      const res = await fetch('/api/payment-links', {
        method: 'POST',
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          amount: Math.round(Number.parseFloat(amount) * 100), // Convert to cents
        }),
      });

      if (!res.ok) throw new Error('Failed to create payment link');

      toast.success('Payment link created successfully');
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error('Failed to create payment link');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Payment Link</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Payment Link</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='email'>Email</Label>
            <Input id='email' name='email' type='email' placeholder='contact@example.com' required />
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='firstName'>First Name</Label>
              <Input id='firstName' name='firstName' placeholder='John' required />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='lastName'>Last Name</Label>
              <Input id='lastName' name='lastName' placeholder='Doe' required />
            </div>
          </div>
          <div className='space-y-2'>
            <Label htmlFor='amount'>Amount</Label>
            <Input id='amount' name='amount' type='number' min='0.01' step='0.01' placeholder='99.99' required />
          </div>
          <Button type='submit' className='w-full' disabled={loading}>
            {loading ? 'Creating...' : 'Create Link'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
