'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/utils/trpc/client';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { toast } from 'sonner';

const SubscriptionContent = () => {
  const searchParams = useSearchParams();
  const couponCode = searchParams.get('code');

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: plan } = api.subscription.fetchStripeSubscriptionPlanByCouponCode.useQuery({ code: couponCode || '' }, { enabled: !!couponCode });

  const { data: coupon } = api.subscription.fetchSubscriptionCouponByCode.useQuery({ code: couponCode || '' }, { enabled: !!couponCode });

  const createContact = api.dashboard.createContact.useMutation();
  const createContactActivity = api.dashboard.createContactActivity.useMutation();

  const handleCheckout = async () => {
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    if (!plan?.price) {
      toast.error('Invalid plan or price');
      return;
    }

    setLoading(true);
    try {
      const contact = await createContact.mutateAsync({
        email,
        company: coupon?.company ?? '',
      });

      await createContactActivity.mutateAsync({
        contactId: contact.id,
        type: 'subscription_page',
        title: 'Started Subscription Checkout',
        description: `Started checkout for plan with coupon code: ${couponCode}`,
        initiatorType: 'contact',
        initiatorId: contact.id,
      });

      const checkoutResponse = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          couponCode,
          contactId: contact.id,
        }),
      });

      let data: any;

      try {
        data = await checkoutResponse.json();
      } catch (e) {
        throw new Error('Invalid response from server');
      }

      if (!checkoutResponse.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Failed to initiate checkout');
      }

      if (!data?.url) {
        throw new Error('No checkout URL received');
      }

      window.location.href = data.url;
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to initiate checkout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='container mx-auto p-6'>
      <Card className='mx-auto max-w-md'>
        <CardHeader>
          <CardTitle>Subscribe to Our Service</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {plan && (
              <div className='rounded-lg bg-muted p-4'>
                <h3 className='font-semibold'>Plan Details</h3>
                <p>Price: ${(plan.price?.unit_amount ?? 0) / 100}</p>
                {couponCode && plan.discountPercent > 0 && <p className='text-green-600'>Discount: {plan.discountPercent * 100}% off</p>}
              </div>
            )}

            <div>
              <Label htmlFor='email'>Email</Label>
              <Input id='email' type='email' value={email} onChange={(e) => setEmail(e.target.value)} placeholder='Enter your email' />
            </div>

            {couponCode && (
              <div>
                <Label>Coupon Code</Label>
                <Input value={couponCode} disabled />
              </div>
            )}

            <Button onClick={handleCheckout} disabled={loading} className='w-full'>
              {loading ? 'Processing...' : 'Proceed to Checkout'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default function SubscriptionPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SubscriptionContent />
    </Suspense>
  );
}
