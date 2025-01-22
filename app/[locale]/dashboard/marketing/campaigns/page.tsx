'use client';

import { ColorBadge } from '@/components/shared/color-badge';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import type { MarketingCampaign } from '@/lib/schema';
import { api } from '@/utils/trpc/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { SearchIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const campaignFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  campaignCode: z.string().optional(),
  description: z.string().optional(),
  type: z.enum(['email', 'social', 'event', 'referral', 'other']),
  status: z.enum(['draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled']),
});

type CampaignFormValues = z.infer<typeof campaignFormSchema>;

export default function MarketingCampaignsPage() {
  const router = useRouter();

  const utils = api.useUtils();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingCampaign, setEditingCampaign] = useState<{
    id: string;
    data: CampaignFormValues;
  } | null>(null);

  const { data: campaigns = [], isLoading } = api.marketing.getAllCampaigns.useQuery();
  const updateCampaign = api.marketing.updateCampaign.useMutation({
    onSuccess: () => {
      toast.success('Campaign updated successfully');
      setEditingCampaign(null);
      utils.marketing.getAllCampaigns.invalidate();
    },
  });

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: editingCampaign?.data,
  });

  const filteredCampaigns = campaigns.filter((campaign) => campaign.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const activeCampaigns = campaigns.filter((c) => c.status === 'active');
  const completedCampaigns = campaigns.filter((c) => c.status === 'completed');
  const totalContacts = campaigns.reduce((acc, c) => acc + (typeof c.contactCount === 'number' ? c.contactCount : 0), 0);
  const totalConversions = campaigns.reduce((acc, c) => acc + (typeof c.convertedCount === 'number' ? c.convertedCount : 0), 0);
  const avgConversionRate = totalContacts > 0 ? Math.round((totalConversions / totalContacts) * 100) : 0;

  const handleEditCampaign = (e: React.MouseEvent, campaign: MarketingCampaign) => {
    e.stopPropagation();
    setEditingCampaign({
      id: campaign.id,
      data: {
        name: campaign.name,
        campaignCode: campaign.campaignCode || undefined,
        description: campaign.description || undefined,
        type: campaign.type,
        status: campaign.status,
      },
    });
    form.reset({
      name: campaign.name,
      campaignCode: campaign.campaignCode || undefined,
      description: campaign.description || undefined,
      type: campaign.type,
      status: campaign.status,
    });
  };

  const onSubmit = async (data: CampaignFormValues) => {
    if (!editingCampaign) return;

    try {
      await updateCampaign.mutateAsync({
        id: editingCampaign.id,
        ...data,
      });
    } catch (error) {
      toast.error('Failed to update campaign');
    }
  };

  return (
    <div className='space-y-4 p-4'>
      <PageHeader
        title='Marketing Campaigns'
        description='Create and manage marketing campaigns'
        right={
          <Link href='/dashboard/marketing/campaigns/new'>
            <Button variant='outline' size='sm' className='h-8'>
              New Campaign
            </Button>
          </Link>
        }
      />

      <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader>
            <CardTitle className='font-medium text-sm'>Active Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='font-bold text-2xl'>{activeCampaigns.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className='font-medium text-sm'>Total Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='font-bold text-2xl'>{totalContacts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className='font-medium text-sm'>Avg. Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='font-bold text-2xl'>{avgConversionRate}%</div>
          </CardContent>
        </Card>
      </div>

      <div className='relative'>
        <SearchIcon className='absolute top-2.5 left-3 h-4 w-4 text-neutral-400' />
        <Input placeholder='Search campaigns...' className='pl-10' value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Contacts</TableHead>
              <TableHead>Conversions</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className='py-4 text-center'>
                  Loading campaigns...
                </TableCell>
              </TableRow>
            ) : filteredCampaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className='py-4 text-center'>
                  No campaigns found
                </TableCell>
              </TableRow>
            ) : (
              filteredCampaigns.map((campaign) => (
                <TableRow key={campaign.id} className='cursor-pointer hover:bg-muted/50' onClick={() => router.push(`/dashboard/marketing/campaigns/${campaign.id}`)}>
                  <TableCell className='font-medium'>
                    <Link href={`/dashboard/marketing/campaigns/${campaign.id}`} className='hover:underline'>
                      {campaign.name}
                    </Link>
                  </TableCell>
                  <TableCell>{campaign.campaignCode || '-'}</TableCell>
                  <TableCell>
                    <ColorBadge type='campaignStatus' value={campaign.status} />
                  </TableCell>
                  <TableCell>{campaign.type}</TableCell>
                  <TableCell>{campaign.contactCount}</TableCell>
                  <TableCell>
                    {campaign.convertedCount} ({campaign.contactCount > 0 ? Math.round((campaign.convertedCount / campaign.contactCount) * 100) : 0}%)
                  </TableCell>
                  <TableCell>{new Date(campaign.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className='text-right'>
                    <div className='flex justify-end gap-2'>
                      <Button variant='outline' size='sm' onClick={(e) => handleEditCampaign(e, campaign)}>
                        Edit
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!editingCampaign} onOpenChange={(open) => !open && setEditingCampaign(null)}>
        <DialogContent className='max-h-[90vh] max-w-xl overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Edit Campaign</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
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
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='type'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select type' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='email'>Email</SelectItem>
                        <SelectItem value='social'>Social</SelectItem>
                        <SelectItem value='event'>Event</SelectItem>
                        <SelectItem value='referral'>Referral</SelectItem>
                        <SelectItem value='other'>Other</SelectItem>
                      </SelectContent>
                    </Select>
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
                  </FormItem>
                )}
              />

              <div className='flex justify-end gap-2'>
                <Button type='button' variant='outline' onClick={() => setEditingCampaign(null)}>
                  Cancel
                </Button>
                <Button type='submit' disabled={updateCampaign.isPending}>
                  {updateCampaign.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
