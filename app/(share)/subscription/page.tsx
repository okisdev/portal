'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/utils/trpc/client';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export default function SubscriptionPage() {
  const searchParams = useSearchParams();
  const couponCode = searchParams.get('code');

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: plan } = api.dashboard.fetchStripeSubscriptionPlanByCouponCode.useQuery({ code: couponCode || '' }, { enabled: !!couponCode });

  const createContact = api.dashboard.addContact.useMutation();
  const createContactActivity = api.dashboard.addContactActivity.useMutation();

  console.log('plan', plan);

  const handleCheckout = async () => {
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      const contact = await createContact.mutateAsync({
        email,
      });

      await createContactActivity.mutateAsync({
        contactId: contact.id,
        type: 'subscription_page',
        title: 'Subscription Page',
        description: 'Subscription Page',
        initiatorType: 'system',
        initiatorId: 'system',
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

      if (!checkoutResponse.ok) {
        throw new Error('Failed to initiate checkout');
      }

      const { url } = await checkoutResponse.json();
      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to initiate checkout');
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
                {/* <p>Price: ${plan.unit_amount}</p> */}
                {/* {couponCode && <p className='text-green-600'>Discount: {planDetails.}% off</p>} */}
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
}
