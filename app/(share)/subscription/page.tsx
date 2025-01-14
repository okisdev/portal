'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function SubscriptionPage() {
  const searchParams = useSearchParams();
  const couponCode = searchParams.get('coupon');

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [planDetails, setPlanDetails] = useState<any>(null);

  useEffect(() => {
    if (couponCode) {
      fetchPlanDetails();
    }
  }, [couponCode]);

  const fetchPlanDetails = async () => {
    try {
      const response = await fetch(`/api/subscription/plan?coupon=${couponCode}`);
      const data = await response.json();
      setPlanDetails(data);
    } catch (error) {
      toast.error('Failed to load plan details');
    }
  };

  const handleCheckout = async () => {
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      // First create or get the contact
      const contactResponse = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          source: 'subscription_page',
          status: 'lead',
        }),
      });

      if (!contactResponse.ok) {
        throw new Error('Failed to create contact');
      }

      const { id: contactId } = await contactResponse.json();

      // Then initiate checkout with the contact ID
      const checkoutResponse = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          couponCode,
          contactId,
        }),
      });

      if (!checkoutResponse.ok) {
        throw new Error('Failed to initiate checkout');
      }

      const { url } = await checkoutResponse.json();
      window.location.href = url; // Redirect to Stripe checkout
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to initiate checkout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='container mx-auto p-6'>
      <Card className='max-w-md mx-auto'>
        <CardHeader>
          <CardTitle>Subscribe to Our Service</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {planDetails && (
              <div className='bg-muted p-4 rounded-lg'>
                <h3 className='font-semibold'>Plan Details</h3>
                <p>Price: ${planDetails.price}</p>
                {couponCode && <p className='text-green-600'>Discount: {planDetails.discountPercent}% off</p>}
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
