'use client';

import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/utils/trpc/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const campaignFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  campaignCode: z.string().min(1, 'Campaign code is required'),
  description: z.string().optional(),
  type: z.enum(['email', 'social', 'event', 'referral', 'other']),
  status: z.enum(['draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled']).default('draft'),
  metrics: z.string().optional(),
});

type CampaignFormValues = z.infer<typeof campaignFormSchema>;

const defaultValues: Partial<CampaignFormValues> = {
  status: 'draft',
  type: 'email',
  campaignCode: '',
};

export default function NewCampaignPage() {
  const router = useRouter();
  const utils = api.useUtils();

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues,
  });

  const { mutate: createCampaign, isPending } = api.marketing.createCampaign.useMutation({
    onSuccess: async () => {
      await utils.marketing.getAllCampaigns.invalidate();
      router.push('/dashboard/marketing/campaigns');
    },
  });

  const onSubmit = (data: CampaignFormValues) => {
    createCampaign(data);
  };

  return (
    <div className='space-y-4 p-4'>
      <PageHeader
        title='New Campaign'
        description='Create a new marketing campaign'
        right={
          <div className='space-x-2'>
            <Button variant='outline' onClick={() => router.back()}>
              Cancel
            </Button>
            <Button onClick={form.handleSubmit(onSubmit)} disabled={isPending}>
              {isPending ? 'Creating...' : 'Create Campaign'}
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className='pt-6'>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Name</FormLabel>
                      <FormControl>
                        <Input placeholder='Enter campaign name' {...field} />
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
                      <FormLabel>Campaign Code</FormLabel>
                      <FormControl>
                        <Input placeholder='Enter unique campaign code' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='type'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select campaign type' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='email'>Email Campaign</SelectItem>
                          <SelectItem value='social'>Social Media Campaign</SelectItem>
                          <SelectItem value='event'>Event Campaign</SelectItem>
                          <SelectItem value='referral'>Referral Campaign</SelectItem>
                          <SelectItem value='other'>Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='status'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select status' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='draft'>Draft</SelectItem>
                          <SelectItem value='scheduled'>Scheduled</SelectItem>
                          <SelectItem value='active'>Active</SelectItem>
                          <SelectItem value='paused'>Paused</SelectItem>
                          <SelectItem value='completed'>Completed</SelectItem>
                          <SelectItem value='cancelled'>Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid grid-cols-1 gap-6'>
                <FormField
                  control={form.control}
                  name='description'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder='Enter campaign description' className='h-24' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='metrics'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Metrics</FormLabel>
                      <FormControl>
                        <Textarea placeholder='Enter campaign metrics (optional)' className='h-24' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
