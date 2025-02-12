'use client';

import { DateRangePicker } from '@/components/shared/date-range-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { addDays } from 'date-fns';
import { Area, AreaChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

// Mock data - Replace with real data from your API
const paymentData = [
  { date: '2024-01', active: 400, expired: 100, cancelled: 50 },
  { date: '2024-02', active: 500, expired: 120, cancelled: 45 },
  { date: '2024-03', active: 650, expired: 150, cancelled: 60 },
  { date: '2024-04', active: 800, expired: 180, cancelled: 55 },
];

const contactsData = [
  { date: '2024-01', total: 1200, leads: 300 },
  { date: '2024-02', total: 1500, leads: 400 },
  { date: '2024-03', total: 1800, leads: 500 },
  { date: '2024-04', total: 2200, leads: 600 },
];

export default function LiveDashboard() {
  return (
    <div className='flex-1 space-y-4 p-4 md:p-8 pt-6'>
      <div className='flex items-center justify-between space-y-2'>
        <h2 className='text-3xl font-bold tracking-tight'>Live Dashboard</h2>
        <div className='flex items-center space-x-2'>
          <DateRangePicker initialDateFrom={addDays(new Date(), -30)} initialDateTo={new Date()} />
        </div>
      </div>

      <Tabs defaultValue='payments' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='payments'>Payments</TabsTrigger>
          <TabsTrigger value='contacts'>Contacts</TabsTrigger>
        </TabsList>

        <TabsContent value='payments' className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            <Card>
              <CardHeader>
                <CardTitle>Active Subscriptions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>800</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Expired Subscriptions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>180</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Cancelled Subscriptions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>55</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Subscription Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='h-[400px]'>
                <ResponsiveContainer width='100%' height='100%'>
                  <AreaChart data={paymentData}>
                    <XAxis dataKey='date' />
                    <YAxis />
                    <Tooltip />
                    <Area type='monotone' dataKey='active' stackId='1' stroke='#10b981' fill='#10b981' />
                    <Area type='monotone' dataKey='expired' stackId='1' stroke='#f59e0b' fill='#f59e0b' />
                    <Area type='monotone' dataKey='cancelled' stackId='1' stroke='#ef4444' fill='#ef4444' />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='contacts' className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2'>
            <Card>
              <CardHeader>
                <CardTitle>Total Contacts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>2,200</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>600</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Contact Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='h-[400px]'>
                <ResponsiveContainer width='100%' height='100%'>
                  <LineChart data={contactsData}>
                    <XAxis dataKey='date' />
                    <YAxis />
                    <Tooltip />
                    <Line type='monotone' dataKey='total' stroke='#2563eb' strokeWidth={2} />
                    <Line type='monotone' dataKey='leads' stroke='#10b981' strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
