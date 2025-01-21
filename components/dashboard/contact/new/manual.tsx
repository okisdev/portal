'use client';

import { ColorBadge } from '@/components/shared/color-badge';
import { Combobox } from '@/components/shared/combobox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { insuranceCompanies, sources } from '@/data/data';
import { type Status, statusSchema } from '@/lib/schema';
import { api } from '@/utils/trpc/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  gender?: string;
  company?: string;
  jobTitle?: string;
  status: Status;
  source?: string;
  remark?: string;
}

interface FormErrors {
  email?: string;
  phone?: string;
  contactInfo?: string;
}

export default function ManualContactForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<ContactFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
    company: '',
    jobTitle: '',
    status: 'lead',
    source: '',
    remark: '',
  });

  const createContact = api.contact.createContact.useMutation({
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    // Check if at least one of email or phone is provided
    if (!formData.email && !formData.phone) {
      newErrors.contactInfo = 'Either email or phone must be provided';
      isValid = false;
    }

    // If email is provided, validate it
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    // If phone is provided, validate it (basic validation)
    if (formData.phone && formData.phone.length < 6) {
      newErrors.phone = 'Please enter a valid phone number';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear errors when user types
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
        contactInfo: undefined, // Clear the combined error message as well
      }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const formatName = (firstName: string, lastName?: string) => {
    if (firstName && lastName) return `${firstName} ${lastName}`;
    return firstName || '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await createContact.mutateAsync({
        firstName: formData.firstName,
        lastName: formData.lastName,
        name: formatName(formData.firstName, formData.lastName),
        email: formData.email,
        phone: formData.phone || '',
        company: formData.company || '',
        source: formData.source || '',
        remark: formData.remark || '',
      });

      toast.success('Contact created successfully');
      router.push(`/dashboard/crm/contacts/${result.id}`);
      router.refresh();
    } catch (error) {
      console.error('Error creating contact:', error);
      toast.error('Failed to create contact');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='max-w-2xl space-y-6'>
      <div className='grid grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label htmlFor='firstName'>First Name *</Label>
          <Input id='firstName' name='firstName' value={formData.firstName} onChange={handleChange} required />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='lastName'>Last Name *</Label>
          <Input id='lastName' name='lastName' value={formData.lastName} onChange={handleChange} required />
        </div>
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label htmlFor='email' className='flex items-center justify-between'>
            <span>Email {!formData.phone && '*'}</span>
            {errors.email && <span className='text-destructive text-sm'>{errors.email}</span>}
          </Label>
          <Input id='email' name='email' type='email' value={formData.email} onChange={handleChange} className={errors.email ? 'border-destructive' : ''} />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='phone' className='flex items-center justify-between'>
            <span>Phone {!formData.email && '*'}</span>
            {errors.phone && <span className='text-destructive text-sm'>{errors.phone}</span>}
          </Label>
          <Input id='phone' name='phone' type='tel' value={formData.phone} onChange={handleChange} className={errors.phone ? 'border-destructive' : ''} />
        </div>
      </div>

      {errors.contactInfo && <div className='text-destructive text-sm'>{errors.contactInfo}</div>}

      <div className='grid grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label htmlFor='gender'>Gender</Label>
          <Select name='gender' value={formData.gender} onValueChange={(value) => handleSelectChange('gender', value)}>
            <SelectTrigger>
              <SelectValue placeholder='Select gender' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='male'>Male</SelectItem>
              <SelectItem value='female'>Female</SelectItem>
              <SelectItem value='other'>Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='company'>Company</Label>
          <Combobox
            value={formData.company ?? ''}
            onChange={(value) => handleSelectChange('company', value)}
            items={insuranceCompanies}
            placeholder='Select company'
            searchPlaceholder='Search company...'
            groupHeading='Companies'
          />
        </div>
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label htmlFor='status'>Status *</Label>
          <Select name='status' value={formData.status} onValueChange={(value) => handleSelectChange('status', value)} required>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusSchema.options.map((status) => (
                <SelectItem key={status} value={status}>
                  <ColorBadge type='contactStatus' value={status} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='source'>Source</Label>
          <Combobox
            value={formData.source ?? ''}
            onChange={(value) => handleSelectChange('source', value)}
            items={sources}
            placeholder='Select source...'
            searchPlaceholder='Search source...'
            groupHeading='Sources'
          />
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
  );
}
