'use client';

import { Combobox } from '@/components/shared/combobox';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { insuranceCompanies, sources } from '@/data/data';
import { statusSchema } from '@/lib/schema';
import { api } from '@/utils/trpc/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  company: z.string().optional(),
  source: z.string().optional(),
  remark: z.string().optional(),
  status: statusSchema.optional(),
  campaignCode: z.string().optional(),
});

export default function ManualContactForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const { data: campaigns } = api.marketing.getAllCampaigns.useQuery();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      source: '',
      remark: '',
      status: 'lead',
      campaignCode: '',
    },
  });

  const createContact = api.contact.createContact.useMutation({
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const formatName = (firstName: string, lastName?: string) => {
    if (firstName && lastName) return `${firstName} ${lastName}`;
    return firstName || '';
  };

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    try {
      const result = await createContact.mutateAsync({
        ...values,
        name: formatName(values.firstName, values.lastName),
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-4'>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <FormField
            control={form.control}
            name='firstName'
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder='John' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='lastName'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder='Doe' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <FormField
            control={form.control}
            name='email'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type='email' placeholder='john@example.com' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='phone'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input type='tel' placeholder='+852 12345678' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <FormField
            control={form.control}
            name='company'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company</FormLabel>
                <FormControl>
                  <Combobox
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    items={insuranceCompanies}
                    placeholder='Select a company'
                    searchPlaceholder='Search companies...'
                    groupHeading='Companies'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='source'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Source</FormLabel>
                <FormControl>
                  <Combobox value={field.value ?? ''} onChange={field.onChange} items={sources} placeholder='Select source...' searchPlaceholder='Search source...' groupHeading='Sources' />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <FormField
            control={form.control}
            name='status'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <FormControl>
                  <Combobox
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    items={statusSchema.options}
                    placeholder='Select a status'
                    searchPlaceholder='Search status...'
                    groupHeading='Statuses'
                    allowCustom={false}
                    renderItem={(id) => {
                      const status = statusSchema.options.find((s) => s === id);
                      return status ?? id;
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='campaignCode'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Campaign</FormLabel>
                <FormControl>
                  <Combobox
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    items={campaigns?.map((c) => c.campaignCode) ?? []}
                    placeholder='Select a campaign'
                    searchPlaceholder='Search campaigns...'
                    groupHeading='Campaigns'
                    allowCustom={false}
                    renderItem={(code) => {
                      const campaign = campaigns?.find((c) => c.campaignCode === code);
                      return campaign?.name ?? code;
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name='remark'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Remark</FormLabel>
              <FormControl>
                <Textarea placeholder='Any additional notes...' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='flex justify-end'>
          <Button type='submit' disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Contact'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
