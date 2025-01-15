'use client';

import { Combobox } from '@/components/shared/combobox';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { insuranceCompanies, sources } from '@/data/data';
import { copyToClipboard } from '@/utils/clipboard';
import { api } from '@/utils/trpc/client';
import { MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function SubscriptionManagement() {
  const [activeTab, setActiveTab] = useState('coupons');
  const [couponData, setCouponData] = useState({
    discountPercent: '',
    maxUses: '',
    expiresAt: '',
    company: '',
    planId: '',
    source: '',
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [planData, setPlanData] = useState({
    name: '',
    description: '',
    price: '',
    interval: 'month' as 'month' | 'year',
    currency: 'usd' as 'usd' | 'eur' | 'gbp' | 'hkd',
  });
  const [showLocalPlans, setShowLocalPlans] = useState(false);

  const utils = api.useUtils();

  const createCoupon = api.pay.createSubscriptionCoupon.useMutation({
    onSuccess: () => {
      utils.pay.fetchSubscriptionCoupons.invalidate();
      toast.success('Coupon created successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { data: coupons } = api.pay.fetchSubscriptionCoupons.useQuery();

  const { data: stripePlans } = api.pay.fetchStripeSubscriptionPlans.useQuery();

  const { data: localPlans } = api.pay.fetchLocalSubscriptionPlans.useQuery();

  const syncStripePlans = api.pay.syncStripeSubscriptionPlans.useMutation();

  const deleteStripePlan = api.pay.deleteStripeSubscriptionPlan.useMutation({
    onSuccess: () => {
      utils.pay.fetchStripeSubscriptionPlans.invalidate();
      toast.success('Plan deleted successfully');
    },
  });

  const createPlan = api.pay.createStripePlan.useMutation({
    onSuccess: () => {
      utils.pay.fetchStripeSubscriptionPlans.invalidate();
      toast.success('Plan created successfully');
      setPlanDialogOpen(false);
      setPlanData({ name: '', description: '', price: '', interval: 'month', currency: 'usd' });
    },
  });

  const updatePlan = api.pay.updateStripePlan.useMutation({
    onSuccess: () => {
      utils.pay.fetchStripeSubscriptionPlans.invalidate();
      toast.success('Plan updated successfully');
      setPlanDialogOpen(false);
      setEditingPlan(null);
    },
  });

  const createPrice = api.pay.createStripePlanPrice.useMutation({
    onSuccess: () => {
      utils.pay.fetchStripeSubscriptionPlans.invalidate();
      toast.success('Price added successfully');
    },
  });

  const deleteCoupon = api.pay.deleteSubscriptionCoupon.useMutation({
    onSuccess: () => {
      utils.pay.fetchSubscriptionCoupons.invalidate();
      toast.success('Coupon deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCreateCoupon = () => {
    if (!couponData.planId) {
      toast.error('Please select a subscription plan');
      return;
    }

    const discountPercent = Number(couponData.discountPercent);

    createCoupon.mutate({
      discountPercent: discountPercent,
      maxUses: couponData.maxUses ? Number(couponData.maxUses) : undefined,
      expiresAt: couponData.expiresAt ? new Date(couponData.expiresAt) : undefined,
      planId: couponData.planId,
      company: couponData.company,
      source: couponData.source,
    });

    setDialogOpen(false);

    setCouponData({
      discountPercent: '',
      maxUses: '',
      expiresAt: '',
      company: '',
      planId: '',
      source: '',
    });
  };

  const handleCreatePlan = () => {
    createPlan.mutate({
      name: planData.name,
      description: planData.description,
      price: Math.round(Number(planData.price) * 100),
      interval: planData.interval,
      currency: planData.currency,
    });
  };

  const handleUpdatePlan = () => {
    if (!editingPlan) return;

    updatePlan.mutate({
      productId: editingPlan.id,
      name: planData.name,
      description: planData.description,
      active: true,
    });
  };

  const handleAddPrice = (productId: string) => {
    createPrice.mutate({
      productId,
      price: Math.round(Number(planData.price) * 100),
      interval: planData.interval,
      currency: planData.currency,
    });
  };

  const handleSyncStripePlans = async () => {
    await syncStripePlans.mutateAsync();
    toast.success('Stripe plans synced successfully');
  };

  return (
    <div className='space-y-6 p-6'>
      <PageHeader title='Subscription Management' description='Manage your subscription plans and coupons' />

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
                    <Button variant='outline' className='h-8'>
                      Create New Coupon
                    </Button>
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
                            {stripePlans?.map((plan: any) => (
                              <SelectItem key={plan.id} value={plan.id}>
                                {plan.name} - ${(plan.metadata?.price || 0) / 100}/{plan.metadata?.interval || 'month'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor='company'>Company</Label>
                        <Combobox
                          value={couponData.company}
                          onChange={(value) => setCouponData({ ...couponData, company: value })}
                          items={insuranceCompanies}
                          placeholder='Select company...'
                          searchPlaceholder='Search company...'
                          groupHeading='Companies'
                        />
                      </div>

                      <div>
                        <Label htmlFor='source'>Source</Label>
                        <Combobox
                          value={couponData.source}
                          onChange={(value) => setCouponData({ ...couponData, source: value })}
                          items={sources}
                          placeholder='Select source...'
                          searchPlaceholder='Search source...'
                          groupHeading='Sources'
                        />
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
                      <TableHead>Source</TableHead>
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
                        <TableCell>{coupon.discountPercent === 0 ? 'No discount' : `${(coupon.discountPercent * 100).toFixed(0)}%`}</TableCell>
                        <TableCell>{coupon.company}</TableCell>
                        <TableCell>{coupon.source ?? 'N/A'}</TableCell>
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
                              <DropdownMenuItem
                                onClick={() =>
                                  deleteCoupon.mutate({
                                    id: coupon.id,
                                    // biome-ignore lint/style/noNonNullAssertion: <explanation>
                                    stripeId: coupon.stripeId ?? '',
                                  })
                                }
                              >
                                Delete coupon
                              </DropdownMenuItem>
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
              <div className='flex items-center gap-4'>
                <CardTitle>Subscription Plans</CardTitle>
                <div className='flex items-center gap-2'>
                  <Switch checked={showLocalPlans} onCheckedChange={setShowLocalPlans} id='local-plans-switch' />
                  <Label htmlFor='local-plans-switch'>Show Local Plans</Label>
                </div>
              </div>
              <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
                <div className='flex items-center justify-end gap-2'>
                  <Button variant='outline' onClick={handleSyncStripePlans} className='h-8'>
                    Sync Stripe Plans
                  </Button>
                  <DialogTrigger asChild>
                    <Button variant='outline' className='h-8'>
                      Create New Plan
                    </Button>
                  </DialogTrigger>
                </div>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingPlan ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
                  </DialogHeader>
                  <div className='space-y-4'>
                    <div>
                      <Label htmlFor='name'>Plan Name</Label>
                      <Input id='name' value={planData.name} onChange={(e) => setPlanData({ ...planData, name: e.target.value })} placeholder='Enter plan name' />
                    </div>

                    <div>
                      <Label htmlFor='description'>Description</Label>
                      <Input id='description' value={planData.description} onChange={(e) => setPlanData({ ...planData, description: e.target.value })} placeholder='Enter plan description' />
                    </div>

                    <div className='grid grid-cols-3 gap-4'>
                      <div className='col-span-2'>
                        <Label htmlFor='price'>Price</Label>
                        <Input id='price' type='number' value={planData.price} onChange={(e) => setPlanData({ ...planData, price: e.target.value })} placeholder='Enter price' />
                      </div>
                      <div>
                        <Label htmlFor='currency'>Currency</Label>
                        <Select value={planData.currency} onValueChange={(value: 'usd' | 'eur' | 'gbp' | 'hkd') => setPlanData({ ...planData, currency: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder='Select currency' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='usd'>USD</SelectItem>
                            <SelectItem value='eur'>EUR</SelectItem>
                            <SelectItem value='gbp'>GBP</SelectItem>
                            <SelectItem value='hkd'>HKD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor='interval'>Billing Interval</Label>
                      <Select value={planData.interval} onValueChange={(value: 'month' | 'year') => setPlanData({ ...planData, interval: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder='Select interval' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='month'>Monthly</SelectItem>
                          <SelectItem value='year'>Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button onClick={editingPlan ? handleUpdatePlan : handleCreatePlan}>{editingPlan ? 'Update Plan' : 'Create Plan'}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    {/* <TableHead>Description</TableHead> */}
                    <TableHead>Price</TableHead>
                    <TableHead>Interval</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(showLocalPlans ? localPlans : stripePlans)?.map((plan: any) => (
                    <TableRow key={plan.id}>
                      <TableCell>{plan.name}</TableCell>
                      {/* <TableCell>{plan.description}</TableCell> */}
                      <TableCell>
                        {plan.metadata?.currency?.toUpperCase() || 'USD'} {(plan.metadata?.price || 0) / 100}
                      </TableCell>
                      <TableCell>{plan.metadata?.interval || 'month'}</TableCell>
                      <TableCell>{plan.active ? 'Active' : 'Inactive'}</TableCell>
                      <TableCell className='space-x-2 text-right'>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' className='h-8 w-8 p-0'>
                              <span className='sr-only'>Open menu</span>
                              <MoreHorizontal className='h-4 w-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            {!showLocalPlans && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setPlanData({
                                      name: plan.name,
                                      description: plan.description || '',
                                      price: ((plan.metadata?.price || 0) / 100).toString(),
                                      interval: (plan.metadata?.interval as 'month' | 'year') || 'month',
                                      currency: (plan.metadata?.currency as 'usd' | 'eur' | 'gbp' | 'hkd') || 'usd',
                                    });
                                    setEditingPlan(plan);
                                    setPlanDialogOpen(true);
                                  }}
                                >
                                  Edit plan
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setPlanData({
                                      ...planData,
                                      price: '',
                                      interval: 'month',
                                    });
                                    handleAddPrice(plan.id);
                                  }}
                                >
                                  Add price
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => deleteStripePlan.mutate({ productId: plan.id })}>Delete plan</DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
