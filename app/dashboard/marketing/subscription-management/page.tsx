'use client';

import { CompanyCombobox } from '@/components/shared/company-combobox';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/utils/trpc/client';
import { MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

type Plan = {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  metadata: {
    price: number;
    interval: string;
  };
  priceId: string | undefined;
};

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  } catch (err) {
    toast.error('Failed to copy to clipboard');
  }
};

export default function SubscriptionManagement() {
  const [activeTab, setActiveTab] = useState('coupons');
  const [couponData, setCouponData] = useState({
    discountPercent: '',
    maxUses: '',
    expiresAt: '',
    company: '',
    planId: '',
    team: '',
  });
  const [dialogOpen, setDialogOpen] = useState(false);

  const utils = api.useUtils();

  const createCoupon = api.dashboard.createSubscriptionCoupon.useMutation({
    onSuccess: () => {
      utils.dashboard.fetchSubscriptionCoupons.invalidate();
      toast.success('Coupon created successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { data: coupons } = api.dashboard.fetchSubscriptionCoupons.useQuery();

  const { data: stripePlans } = api.dashboard.fetchStripeSubscriptionPlans.useQuery();

  const handleCreateCoupon = () => {
    if (!couponData.planId) {
      toast.error('Please select a subscription plan');
      return;
    }

    const discountDecimal = Number(couponData.discountPercent) / 100;

    createCoupon.mutate({
      discountPercent: discountDecimal,
      maxUses: couponData.maxUses ? Number(couponData.maxUses) : undefined,
      expiresAt: couponData.expiresAt ? new Date(couponData.expiresAt) : undefined,
      planId: couponData.planId,
      company: couponData.company,
    });

    setDialogOpen(false);

    setCouponData({
      discountPercent: '',
      maxUses: '',
      expiresAt: '',
      company: '',
      planId: '',
      team: '',
    });
  };

  return (
    <div className='container mx-auto max-w-6xl'>
      <h1 className='mb-6 font-bold text-2xl'>Subscription Management</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value='coupons'>Coupons</TabsTrigger>
          <TabsTrigger value='plans'>Subscription Plans</TabsTrigger>
        </TabsList>

        <TabsContent value='coupons'>
          <div className='flex flex-col gap-4'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between'>
                <CardTitle>Active Coupons</CardTitle>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>Create New Coupon</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Coupon</DialogTitle>
                    </DialogHeader>
                    <div className='space-y-4'>
                      <div>
                        <Label htmlFor='plan'>Subscription Plan</Label>
                        <Select value={couponData.planId} onValueChange={(value) => setCouponData({ ...couponData, planId: value })}>
                          <SelectTrigger className='w-full'>
                            <SelectValue placeholder='Select a plan' />
                          </SelectTrigger>
                          <SelectContent>
                            {stripePlans?.map((plan: Plan) => (
                              <SelectItem key={plan.id} value={plan.id}>
                                {plan.name} - ${plan.metadata.price / 100}/{plan.metadata.interval}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor='company'>Company</Label>
                        <CompanyCombobox value={couponData.company} onChange={(value) => setCouponData({ ...couponData, company: value })} />
                      </div>

                      <div>
                        <Label htmlFor='discountPercent'>Discount Percentage</Label>
                        <div className='flex items-center gap-2'>
                          <Input
                            id='discountPercent'
                            type='number'
                            min='1'
                            max='100'
                            value={couponData.discountPercent}
                            onChange={(e) => {
                              const value = Math.min(100, Math.max(1, Number(e.target.value)));
                              setCouponData({ ...couponData, discountPercent: value.toString() });
                            }}
                            placeholder='Enter discount percentage'
                          />
                          <span>%</span>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor='maxUses'>Maximum Uses</Label>
                        <Input id='maxUses' type='number' value={couponData.maxUses} onChange={(e) => setCouponData({ ...couponData, maxUses: e.target.value })} placeholder='Enter maximum uses' />
                      </div>

                      <div>
                        <Label htmlFor='expiresAt'>Expiration Date</Label>
                        <Input id='expiresAt' type='datetime-local' value={couponData.expiresAt} onChange={(e) => setCouponData({ ...couponData, expiresAt: e.target.value })} />
                      </div>

                      <Button onClick={handleCreateCoupon}>Create Coupon</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Uses</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead className='text-right'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coupons?.map((coupon) => (
                      <TableRow key={coupon.id}>
                        <TableCell>{coupon.code}</TableCell>
                        <TableCell>{coupon.planId}</TableCell>
                        <TableCell>{(coupon.discountPercent * 100).toFixed(0)}%</TableCell>
                        <TableCell>{coupon.company}</TableCell>
                        <TableCell>
                          {coupon.usedCount}/{coupon.maxUses || '∞'}
                        </TableCell>
                        <TableCell>{coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : 'Never'}</TableCell>
                        <TableCell className='text-right'>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant='ghost' className='h-8 w-8 p-0'>
                                <span className='sr-only'>Open menu</span>
                                <MoreHorizontal className='h-4 w-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuItem onClick={() => copyToClipboard(coupon.code)}>Copy code</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => copyToClipboard(`${window.location.origin}/subscription?code=${coupon.code}`)}>Copy link</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value='plans'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between'>
              <CardTitle>Subscription Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Interval</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stripePlans?.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell>{plan.name}</TableCell>
                      <TableCell>${plan.metadata.price / 100}</TableCell>
                      <TableCell>{plan.metadata.interval}</TableCell>
                      <TableCell>{plan.active ? 'Active' : 'Inactive'}</TableCell>
                      <TableCell className='text-right'>
                        <Button variant='outline' size='sm'>
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
