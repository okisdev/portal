'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusIcon, SearchIcon } from 'lucide-react';
import { useState } from 'react';

interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'draft' | 'completed';
  type: string;
  startDate: string;
  budget: number;
  performance: number;
}

const sampleCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Summer Sale 2024',
    status: 'active',
    type: 'Email',
    startDate: '2024-06-01',
    budget: 5000,
    performance: 85,
  },
  {
    id: '2',
    name: 'New Product Launch',
    status: 'draft',
    type: 'Social Media',
    startDate: '2024-07-15',
    budget: 10000,
    performance: 0,
  },
  {
    id: '3',
    name: 'Holiday Campaign',
    status: 'completed',
    type: 'Multi-channel',
    startDate: '2023-12-01',
    budget: 15000,
    performance: 92,
  },
];

const getStatusColor = (status: Campaign['status']) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'draft':
      return 'bg-gray-100 text-gray-800';
    case 'completed':
      return 'bg-blue-100 text-blue-800';
  }
};

export default function MarketingCampaignsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCampaigns = sampleCampaigns.filter((campaign) => campaign.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='font-medium text-2xl'>Marketing Campaigns</h1>
        <Button variant='outline'>
          <PlusIcon className='mr-2 h-4 w-4' />
          New Campaign
        </Button>
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader>
            <CardTitle className='font-medium text-sm'>Active Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='font-bold text-2xl'>{sampleCampaigns.filter((c) => c.status === 'active').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className='font-medium text-sm'>Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='font-bold text-2xl'>${sampleCampaigns.reduce((acc, c) => acc + c.budget, 0).toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className='font-medium text-sm'>Avg. Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='font-bold text-2xl'>
              {Math.round(sampleCampaigns.filter((c) => c.status === 'completed').reduce((acc, c) => acc + c.performance, 0) / sampleCampaigns.filter((c) => c.status === 'completed').length)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <div className='relative'>
        <SearchIcon className='absolute top-3 left-3 h-4 w-4 text-gray-400' />
        <Input placeholder='Search campaigns...' className='pl-10' value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Performance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCampaigns.map((campaign) => (
              <TableRow key={campaign.id}>
                <TableCell className='font-medium'>{campaign.name}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(campaign.status)}>{campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}</Badge>
                </TableCell>
                <TableCell>{campaign.type}</TableCell>
                <TableCell>{new Date(campaign.startDate).toLocaleDateString()}</TableCell>
                <TableCell>${campaign.budget.toLocaleString()}</TableCell>
                <TableCell>{campaign.status === 'draft' ? '-' : `${campaign.performance}%`}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
