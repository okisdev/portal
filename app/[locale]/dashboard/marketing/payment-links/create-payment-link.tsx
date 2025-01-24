'use client';

import { Combobox } from '@/components/shared/combobox';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/utils/trpc/client';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export function CreatePaymentLink() {
  const t = useTranslations();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [selectedContact, setSelectedContact] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
  });

  const { data: contacts } = api.contact.getAllContacts.useQuery();
  const contactOptions = contacts?.map((contact) => `${contact.firstName} ${contact.lastName} (${contact.email})`) || [];

  const handleContactSelect = (value: string) => {
    setSelectedContact(value);
    const contact = contacts?.find((c) => `${c.firstName} ${c.lastName} (${c.email})` === value);
    if (contact) {
      setFormData({
        email: contact.email,
        firstName: contact.firstName,
        lastName: contact.lastName,
      });
    }
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formDataObj = new FormData(e.currentTarget);
    const amount = formDataObj.get('amount') as string;

    try {
      const res = await fetch('/api/payment-links', {
        method: 'POST',
        body: JSON.stringify({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
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
      <DialogContent className='max-h-[90vh] max-w-xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Create Payment Link</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label>Select Contact</Label>
            <Combobox
              value={selectedContact}
              onChange={handleContactSelect}
              items={contactOptions}
              placeholder='Select a contact'
              searchPlaceholder={t('search_contacts')}
              emptyText={t('no_contacts_found')}
              allowCustom={false}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='email'>Email</Label>
            <Input
              id='email'
              name='email'
              type='email'
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              placeholder='contact@example.com'
              required
            />
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='firstName'>First Name</Label>
              <Input id='firstName' name='firstName' value={formData.firstName} onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))} placeholder='John' required />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='lastName'>Last Name</Label>
              <Input id='lastName' name='lastName' value={formData.lastName} onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))} placeholder='Doe' required />
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
