'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/utils/trpc/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  status: string;
  type: string;
}

export default function NewContact() {
  const router = useRouter();
  const [formData, setFormData] = useState<ContactFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    status: 'active',
    type: 'customer',
  });

  const [isLoading, setIsLoading] = useState(false);

  const createContact = api.dashboard.addContact.useMutation({
    onSuccess: () => {
      toast.success('Contact created successfully');
      router.push('/dashboard/crm/contacts');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await createContact.mutateAsync({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
      });

      router.push('/dashboard/crm/contacts');

      router.refresh();
    } catch (error) {
      console.error('Error creating contact:', error);
      // TODO: Add error handling/notification
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='p-6'>
      <div className='mt-6'>
        <h1 className='mb-6 font-bold text-2xl'>Add New Contact</h1>

        <form onSubmit={handleSubmit} className='max-w-2xl space-y-6'>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='firstName'>First Name</Label>
              <Input id='firstName' name='firstName' value={formData.firstName} onChange={handleChange} required />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='lastName'>Last Name</Label>
              <Input id='lastName' name='lastName' value={formData.lastName} onChange={handleChange} required />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='email'>Email</Label>
            <Input id='email' name='email' type='email' value={formData.email} onChange={handleChange} required />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='phone'>Phone</Label>
            <Input id='phone' name='phone' type='tel' value={formData.phone} onChange={handleChange} />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='company'>Company</Label>
            <Input id='company' name='company' value={formData.company} onChange={handleChange} />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='status'>Status</Label>
              <Select name='status' value={formData.status} onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))} defaultValue='active'>
                <SelectTrigger>
                  <SelectValue placeholder='Select status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='active'>Active</SelectItem>
                  <SelectItem value='inactive'>Inactive</SelectItem>
                  <SelectItem value='lead'>Lead</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='type'>Type</Label>
              <Select name='type' value={formData.type} onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))} defaultValue='customer'>
                <SelectTrigger>
                  <SelectValue placeholder='Select type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='customer'>Customer</SelectItem>
                  <SelectItem value='prospect'>Prospect</SelectItem>
                  <SelectItem value='partner'>Partner</SelectItem>
                  <SelectItem value='vendor'>Vendor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='flex gap-4'>
            <Button type='submit' disabled={isLoading} className='w-full sm:w-auto'>
              {isLoading ? 'Creating...' : 'Create Contact'}
            </Button>
            <Button type='button' variant='outline' onClick={() => router.back()} className='w-full sm:w-auto'>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
