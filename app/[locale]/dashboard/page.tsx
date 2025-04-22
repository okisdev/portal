'use client';

import { PageHeader } from '@/components/shared/page-header';
import { PageLoading } from '@/components/shared/page-loading';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { api } from '@/utils/trpc/client';
import { format, startOfMonth, subMonths } from 'date-fns';
import { CheckCircle, Flame, HelpCircle, Phone, Users } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';

export default function Dashboard() {
  const t = useTranslations();
  const { data: session, status } = useSession();
  const [timePeriod, setTimePeriod] = useState('this-month');

  // Fetch all contacts
  const { data: contacts, isLoading: isContactsLoading } = api.contact.getAllContacts.useQuery();

  // Calculate metrics based on contacts data
  const metrics = useMemo(() => {
    if (!contacts) return null;

    const now = new Date();
    const monthStart = startOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));

    const thisMonthContacts = contacts.filter((contact) => new Date(contact.createdAt) >= monthStart);

    const lastMonthContacts = contacts.filter((contact) => new Date(contact.createdAt) >= lastMonthStart && new Date(contact.createdAt) < monthStart);

    const contactedLeads = contacts.filter((contact) => contact.lastContactedAt).length;
    const qualifiedLeads = contacts.filter((contact) => contact.status === 'Qualified').length;
    const hotLeads = contacts.filter((contact) => contact.priority === 'High').length;

    // Calculate growth percentages
    const totalGrowth = lastMonthContacts.length > 0 ? ((thisMonthContacts.length - lastMonthContacts.length) / lastMonthContacts.length) * 100 : 0;

    return {
      total: contacts.length,
      totalThisMonth: thisMonthContacts.length,
      contacted: contactedLeads,
      qualified: qualifiedLeads,
      hot: hotLeads,
      growth: totalGrowth.toFixed(0),
    };
  }, [contacts]);

  // Prepare data for monthly growth chart
  const chartData = useMemo(() => {
    if (!contacts) return [];

    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthLeads = contacts.filter((contact) => new Date(contact.createdAt) >= monthStart && new Date(contact.createdAt) < (i === 0 ? new Date() : startOfMonth(subMonths(date, -1)))).length;

      return {
        month: format(date, 'MMM'),
        leads: monthLeads,
      };
    }).reverse();

    return last6Months;
  }, [contacts]);

  // Prepare data for status breakdown
  const statusData = useMemo(() => {
    if (!contacts) return [];

    const statusCounts = contacts.reduce(
      (acc, contact) => {
        acc[contact.status] = (acc[contact.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      value: count,
      color: getStatusColor(status),
    }));
  }, [contacts]);

  if (status === 'loading' || isContactsLoading) {
    return <PageLoading />;
  }

  // Helper function to get status colors
  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      Lead: '#4F46E5',
      Contacted: '#7C3AED',
      Qualified: '#EC4899',
      Negotiation: '#F59E0B',
      Customer: '#10B981',
      Lost: '#6B7280',
    };
    return colors[status] || '#6B7280';
  }

  return (
    <div className='container mx-auto h-[calc(100vh-4rem)] p-4'>
      <div className='flex h-full flex-col'>
        {/* Header Section */}
        <div className='flex justify-between items-center mb-6'>
          <PageHeader title={t('welcome_back', { name: session?.user?.name || '' })} description={t('welcome_description')} />
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='Select period' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='this-month'>{t('this_month')}</SelectItem>
              <SelectItem value='last-month'>{t('last_month')}</SelectItem>
              <SelectItem value='last-3-months'>{t('last_3_months')}</SelectItem>
              <SelectItem value='last-6-months'>{t('last_6_months')}</SelectItem>
              <SelectItem value='this-year'>{t('this_year')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Main Content */}
        <div className='flex-1 flex flex-col lg:flex-row gap-6'>
          {/* Left Column - Metrics and Chart */}
          <div className='w-full lg:w-2/3 space-y-6'>
            {/* Metrics Grid */}
            <div className='grid grid-cols-2 lg:grid-cols-4 gap-6'>
              <div className='relative flex items-start gap-3 p-4 rounded-lg border bg-card'>
                <div className='flex items-center justify-center size-8 rounded-lg bg-primary/10'>
                  <Users className='size-4 text-primary' />
                </div>
                <div className='min-w-0 flex-1'>
                  <div className='flex items-center gap-1'>
                    <p className='text-sm text-muted-foreground'>{t('total_leads')}</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className='size-3 text-muted-foreground' />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('total_leads_description')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className='mt-1'>
                    <p className='text-2xl font-semibold truncate'>{metrics?.total || 0}</p>
                    {metrics?.growth && (
                      <p className='text-xs text-muted-foreground'>
                        <span className={Number(metrics.growth) > 0 ? 'text-green-500' : Number(metrics.growth) < 0 ? 'text-red-500' : ''}>
                          {Number(metrics.growth) > 0 ? '↑' : Number(metrics.growth) < 0 ? '↓' : ''} {Math.abs(Number(metrics.growth))}%
                        </span>
                        {' vs last month'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className='relative flex items-start gap-3 p-4 rounded-lg border bg-card'>
                <div className='flex items-center justify-center size-8 rounded-lg bg-primary/10'>
                  <Phone className='size-4 text-primary' />
                </div>
                <div className='min-w-0 flex-1'>
                  <div className='flex items-center gap-1'>
                    <p className='text-sm text-muted-foreground'>{t('contacted_leads')}</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className='size-3 text-muted-foreground' />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('contacted_leads_description')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className='mt-1'>
                    <p className='text-2xl font-semibold truncate'>{metrics?.contacted || 0}</p>
                    <p className='text-xs text-muted-foreground'>{(((metrics?.contacted || 0) / (metrics?.total || 1)) * 100).toFixed(0)}% of total</p>
                  </div>
                </div>
              </div>

              <div className='relative flex items-start gap-3 p-4 rounded-lg border bg-card'>
                <div className='flex items-center justify-center size-8 rounded-lg bg-primary/10'>
                  <CheckCircle className='size-4 text-primary' />
                </div>
                <div className='min-w-0 flex-1'>
                  <div className='flex items-center gap-1'>
                    <p className='text-sm text-muted-foreground'>{t('qualified_leads')}</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className='size-3 text-muted-foreground' />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('qualified_leads_description')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className='mt-1'>
                    <p className='text-2xl font-semibold truncate'>{metrics?.qualified || 0}</p>
                    <p className='text-xs text-muted-foreground'>{(((metrics?.qualified || 0) / (metrics?.total || 1)) * 100).toFixed(0)}% of total</p>
                  </div>
                </div>
              </div>

              <div className='relative flex items-start gap-3 p-4 rounded-lg border bg-card'>
                <div className='flex items-center justify-center size-8 rounded-lg bg-primary/10'>
                  <Flame className='size-4 text-primary' />
                </div>
                <div className='min-w-0 flex-1'>
                  <div className='flex items-center gap-1'>
                    <p className='text-sm text-muted-foreground'>{t('hot_leads')}</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className='size-3 text-muted-foreground' />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('hot_leads_description')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className='mt-1'>
                    <p className='text-2xl font-semibold truncate'>{metrics?.hot || 0}</p>
                    <p className='text-xs text-muted-foreground'>{(((metrics?.hot || 0) / (metrics?.total || 1)) * 100).toFixed(0)}% of total</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart Section */}
            <div className='flex-1 rounded-lg border bg-card p-6'>
              <h2 className='font-medium mb-4'>{t('monthly_lead_growth')}</h2>
              <div className='h-[300px]'>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='month' />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey='leads' fill='#4F46E5' radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Right Column - Status Breakdown */}
          <div className='w-full lg:w-1/3 rounded-lg border bg-card p-6'>
            <h2 className='font-medium mb-4'>{t('leads_by_status')}</h2>
            <div className='space-y-4'>
              {statusData.map((status) => (
                <div key={status.status} className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <div className='size-3 rounded-full' style={{ backgroundColor: status.color }} />
                    <span className='text-sm'>{status.status}</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm font-medium'>{status.value}</span>
                    <span className='text-xs text-muted-foreground'>{((status.value / (metrics?.total || 1)) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
