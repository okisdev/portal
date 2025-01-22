'use client';

import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api } from '@/utils/trpc/client';
import { SearchIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';

const getStatusColor = (status: CampaignStatus) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'draft':
      return 'bg-neutral-100 text-neutral-800';
    case 'completed':
      return 'bg-blue-100 text-blue-800';
    case 'scheduled':
      return 'bg-yellow-100 text-yellow-800';
    case 'paused':
      return 'bg-orange-100 text-orange-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
  }
};

export default function MarketingCampaignsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: campaigns = [], isLoading } = api.marketing.getAllCampaigns.useQuery();

  const filteredCampaigns = campaigns.filter((campaign) => campaign.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const activeCampaigns = campaigns.filter((c) => c.status === 'active');
  const completedCampaigns = campaigns.filter((c) => c.status === 'completed');
  const totalContacts = campaigns.reduce((acc, c) => acc + (c.contactCount || 0), 0);
  const totalConversions = campaigns.reduce((acc, c) => acc + (c.convertedCount || 0), 0);
  const avgConversionRate = totalContacts > 0 ? Math.round((totalConversions / totalContacts) * 100) : 0;

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
        <SearchIcon className='absolute top-3 left-3 h-4 w-4 text-neutral-400' />
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
              <TableHead>Actions</TableHead>
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
                <TableRow key={campaign.id}>
                  <TableCell className='font-medium'>
                    <Link href={`/dashboard/marketing/campaigns/${campaign.id}`} className='hover:underline'>
                      {campaign.name}
                    </Link>
                  </TableCell>
                  <TableCell>{campaign.campaignCode || '-'}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(campaign.status)}>{campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}</Badge>
                  </TableCell>
                  <TableCell>{campaign.type}</TableCell>
                  <TableCell>{campaign.contactCount}</TableCell>
                  <TableCell>
                    {campaign.convertedCount} ({campaign.contactCount > 0 ? Math.round((campaign.convertedCount / campaign.contactCount) * 100) : 0}%)
                  </TableCell>
                  <TableCell>{new Date(campaign.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className='flex gap-2'>
                      <Link href={`/dashboard/marketing/campaigns/${campaign.id}`}>
                        <Button variant='outline' size='sm'>
                          View
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
