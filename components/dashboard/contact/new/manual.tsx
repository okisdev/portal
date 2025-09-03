'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { format, isValid, parse, startOfDay } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod/v4';
import { Combobox } from '@/components/shared/combobox';
import { EmailInput } from '@/components/shared/email-input';
import { PhoneInput } from '@/components/shared/phone-input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { sources } from '@/data/data';
import type { Status } from '@/lib/schema';
import { cn } from '@/lib/utils';
import { api } from '@/utils/trpc/client';

const formSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  companyId: z.string().nullable().optional(),
  source: z.string().optional(),
  remark: z.string().optional(),
  status: z.string().optional(),
  createdAt: z.date().optional(),
});

export default function ManualContactForm() {
  const t = useTranslations();

  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const { data: companies } = api.company.getAllCompanies.useQuery();

  const { data: statuses } = api.site.getStatus.useQuery();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      companyId: null,
      source: 'N/A',
      remark: '',
      status: 'Lead',
      createdAt: undefined,
    },
  });

  const createContact = api.contact.createContact.useMutation({
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const formatName = (firstName?: string, lastName?: string) => {
    if (!(firstName || lastName)) {
      return 'N/A';
    }
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    return firstName || lastName || 'N/A';
  };

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    try {
      // Ensure createdAt is set to midnight if provided
      const createdAt = values.createdAt
        ? startOfDay(values.createdAt)
        : undefined;

      const result = await createContact.mutateAsync({
        ...values,
        name: formatName(values.firstName, values.lastName),
        createdAt,
      });

      toast.success(t('contact_created_successfully'));
      router.push(`/dashboard/crm/contacts/${result.id}`);
      router.refresh();
    } catch (error) {
      console.error('Error creating contact:', error);
      toast.error('Failed to create contact');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to parse date from various formats
  const parseDate = (dateString: string): Date | undefined => {
    if (!dateString) {
      return;
    }

    // Try different date formats
    const formats = [
      'dd/MM/yyyy', // 16/2/2025
      'MM/dd/yyyy', // 2/16/2025
      'yyyy-MM-dd', // 2025-02-16
      'yyyy/MM/dd', // 2025/02/16
      'dd-MM-yyyy', // 16-02-2025
      'MM-dd-yyyy', // 02-16-2025
      'dd.MM.yyyy', // 16.02.2025
      'MM.dd.yyyy', // 02.16.2025
    ];

    for (const formatString of formats) {
      try {
        const parsedDate = parse(dateString, formatString, new Date());
        if (isValid(parsedDate)) {
          return startOfDay(parsedDate); // Set time to midnight (00:00)
        }
      } catch (error) {
        // Continue to next format if parsing fails
      }
    }

    // If all parsing attempts fail, try native Date parsing as a fallback
    const fallbackDate = new Date(dateString);
    if (isValid(fallbackDate)) {
      return startOfDay(fallbackDate);
    }

    return;
  };

  return (
    <Form {...form}>
      <form className='space-y-4' onSubmit={form.handleSubmit(handleSubmit)}>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <FormField
            control={form.control}
            name='firstName'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('first_name')}</FormLabel>
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
                <FormLabel>{t('last_name')}</FormLabel>
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
                <FormLabel>{t('email')}</FormLabel>
                <FormControl>
                  <EmailInput
                    onChange={field.onChange}
                    value={field.value || ''}
                  />
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
                <FormLabel>{t('phone')}</FormLabel>
                <FormControl>
                  <PhoneInput
                    onChange={field.onChange}
                    value={field.value || ''}
                  />
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
                <FormLabel>{t('company')}</FormLabel>
                <FormControl>
                  <Combobox
                    allowCustom={true}
                    groupHeading={t('companies')}
                    items={companies?.map((c) => c.name) || []}
                    onChange={(value) => {
                      const selectedCompany = companies?.find(
                        (c) => c.name === value
                      );
                      form.setValue(
                        'company',
                        selectedCompany ? selectedCompany.name : value
                      );
                      form.setValue('companyId', selectedCompany?.id || null);
                    }}
                    placeholder={t('select_company')}
                    searchPlaceholder={t('search_company')}
                    value={field.value ?? ''}
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
                <FormLabel>{t('source')}</FormLabel>
                <FormControl>
                  <Combobox
                    groupHeading={t('sources')}
                    items={sources}
                    onChange={field.onChange}
                    placeholder={t('select_source')}
                    searchPlaceholder={t('search_source')}
                    value={field.value ?? ''}
                  />
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
                <FormLabel>{t('status')}</FormLabel>
                <FormControl>
                  <Combobox
                    allowCustom={false}
                    groupHeading={t('statuses')}
                    items={statuses?.map((s: Status) => s.value) ?? []}
                    onChange={field.onChange}
                    placeholder={t('select_status')}
                    renderItem={(id) => {
                      const status = statuses?.find(
                        (s: Status) => s.value === id
                      );
                      return status?.value ?? id;
                    }}
                    searchPlaceholder={t('search_status')}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <FormField
            control={form.control}
            name='createdAt'
            render={({ field }) => (
              <FormItem className='flex flex-col'>
                <FormLabel>{t('created_at')}</FormLabel>
                <div className='relative flex gap-2'>
                  <FormControl>
                    <Input
                      onChange={(e) => {
                        const parsedDate = parseDate(e.target.value);
                        field.onChange(parsedDate);
                      }}
                      placeholder='YYYY/MM/DD'
                      value={
                        field.value ? format(field.value, 'yyyy/MM/dd') : ''
                      }
                    />
                  </FormControl>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        className={cn('px-2')}
                        type='button'
                        variant={'outline'}
                      >
                        <CalendarIcon className='h-4 w-4' />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align='start' className='w-auto p-0'>
                      <Calendar
                        disabled={(date) => date > new Date()}
                        initialFocus
                        mode='single'
                        onSelect={field.onChange}
                        selected={field.value}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <div />
        </div>

        <FormField
          control={form.control}
          name='remark'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('remark')}</FormLabel>
              <FormControl>
                <Textarea placeholder={t('any_additional_notes')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='flex justify-end'>
          <Button disabled={isLoading} type='submit'>
            {isLoading ? t('creating') : t('create_contact')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
