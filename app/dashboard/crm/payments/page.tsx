'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/utils/pay';
import { api } from '@/utils/trpc/client';
import { format } from 'date-fns';
import { Loader2, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

const chartData = [
  { month: 'January', desktop: 186, mobile: 80 },
  { month: 'February', desktop: 305, mobile: 200 },
  { month: 'March', desktop: 237, mobile: 120 },
  { month: 'April', desktop: 73, mobile: 190 },
  { month: 'May', desktop: 209, mobile: 130 },
  { month: 'June', desktop: 214, mobile: 140 },
];

const chartConfig = {
  desktop: {
    label: 'Desktop',
    color: 'hsl(var(--chart-1))',
  },
  mobile: {
    label: 'Mobile',
    color: 'hsl(var(--chart-2))',
  },
  amount: {
    label: 'Amount',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

export default function PaymentsPage() {
  const { data: payments, isLoading } = api.pay.getPaymentsFromStripe.useQuery();

  if (isLoading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  const totalRevenue = payments?.reduce((sum, payment) => {
    return payment.status === 'succeeded' ? sum + payment.amount : sum;
  }, 0);

  // Group payments by month for the chart
  const monthlyData = payments
    ?.reduce((acc: any[], payment) => {
      const month = format(new Date(payment.created * 1000), 'MMM yyyy');
      const existing = acc.find((item) => item.month === month);

      if (existing) {
        if (payment.status === 'succeeded') {
          existing.amount += payment.amount;
        }
      } else {
        acc.push({
          month,
          amount: payment.status === 'succeeded' ? payment.amount : 0,
        });
      }
      return acc;
    }, [])
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

  // Calculate success rate
  const successfulPayments = payments?.filter((p) => p.status === 'succeeded').length || 0;
  const successRate = payments?.length ? (successfulPayments / payments.length) * 100 : 0;

  return (
    <div className='space-y-6'>
      <PageHeader title='Payments' description='Manage your payments' />

      <Tabs defaultValue='overview' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='analytics'>Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-3'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='font-medium text-sm'>Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='font-bold text-2xl'>{formatCurrency(totalRevenue || 0)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='font-medium text-sm'>Successful Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='font-bold text-2xl'>{successfulPayments}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='font-medium text-sm'>Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='font-bold text-2xl'>{successRate.toFixed(1)}%</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue</CardTitle>
              <CardDescription>Revenue breakdown by month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='h-auto'>
                <ChartContainer config={chartConfig}>
                  <BarChart
                    accessibilityLayer
                    data={
                      monthlyData
                        ? [
                            { month: 'Jul 2024', amount: 927222 },
                            { month: 'Aug 2024', amount: 2966333 },
                            { month: 'Sep 2024', amount: 2762111 },
                            { month: 'Oct 2024', amount: 1128846 },
                            { month: 'Nov 2024', amount: 296673 },
                            { month: 'Dec 2024', amount: 1629326 },
                            ...monthlyData,
                          ]
                        : []
                    }
                    layout='vertical'
                    margin={{
                      left: -20,
                    }}
                  >
                    <XAxis type='number' dataKey='amount' hide />
                    <YAxis dataKey='month' type='category' tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(value) => value.slice(0, 3)} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                    <Bar dataKey='amount' fill='var(--color-amount)' radius={5} />
                  </BarChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='analytics' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
              <CardDescription>Detailed list of all payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {payments?.map((payment) => (
                  <div key={payment.id} className='flex items-center justify-between rounded-lg border p-4'>
                    <div>
                      <p className='font-medium'>Payment ID: {payment.id}</p>
                      <p className='text-muted-foreground text-sm'>{format(new Date(payment.created * 1000), 'PPP')}</p>
                    </div>
                    <div className='flex items-center gap-4'>
                      <span className={`capitalize ${payment.status === 'succeeded' ? 'text-green-600' : 'text-red-600'}`}>{payment.status}</span>
                      <span className='font-bold'>{formatCurrency(payment.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <ChartContainer config={chartConfig}>
                <BarChart accessibilityLayer data={chartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey='month' tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(value) => value.slice(0, 3)} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator='dashed' />} />
                  <Bar dataKey='desktop' fill='var(--color-desktop)' radius={4} />
                  <Bar dataKey='mobile' fill='var(--color-mobile)' radius={4} />
                </BarChart>
              </ChartContainer>
            </CardContent>
            <CardFooter className='flex-col items-start gap-2 text-sm'>
              <div className='flex gap-2 font-medium leading-none'>
                Trending up by 5.2% this month <TrendingUp className='h-4 w-4' />
              </div>
              <div className='text-muted-foreground leading-none'>Showing total visitors for the last 6 months</div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
