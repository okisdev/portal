'use client';

import { PageHeader } from '@/components/shared/page-header';
import { PageLoading } from '@/components/shared/page-loading';
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { api } from '@/utils/trpc/client';
import { format, startOfMonth, subMonths } from 'date-fns';
import { BarChart2, CheckCircle, Flame, HelpCircle, Phone, PieChart, TrendingUp, Users } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

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
        month: format(date, 'MMMM'),
        leads: monthLeads,
      };
    }).reverse();

    return last6Months;
  }, [contacts]);

  const chartConfig = {
    leads: {
      label: t('leads'),
      color: 'var(--chart-1)',
    },
  } satisfies ChartConfig;

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
        <div className='mb-6 flex items-center justify-between'>
          <PageHeader title={t('welcome_back', { name: session?.user?.name || '' })} description={t('welcome_description')} />
          {/* <Select value={timePeriod} onValueChange={setTimePeriod}>
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
          </Select> */}
        </div>

        {/* Main Content */}
        <div className='flex flex-1 flex-col gap-6 lg:flex-row'>
          {/* Left Column - Metrics and Chart */}
          <div className='w-full space-y-6 lg:w-2/3'>
            {/* Metrics Grid */}
            <div className='grid grid-cols-2 gap-6 lg:grid-cols-4'>
              <div className='relative flex items-start gap-3 rounded-lg border bg-card p-4'>
                <div className='flex size-8 items-center justify-center rounded-lg bg-primary/10'>
                  <Users className='size-4 text-primary' />
                </div>
                <div className='min-w-0 flex-1'>
                  <div className='flex items-center gap-1'>
                    <p className='text-muted-foreground text-sm'>{t('total_leads')}</p>
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
                    <p className='truncate font-semibold text-2xl'>{metrics?.total || 0}</p>
                    {metrics?.growth && (
                      <p className='text-muted-foreground text-xs'>
                        <span className={Number(metrics.growth) > 0 ? 'text-green-500' : Number(metrics.growth) < 0 ? 'text-red-500' : ''}>
                          {Number(metrics.growth) > 0 ? '↑' : Number(metrics.growth) < 0 ? '↓' : ''} {Math.abs(Number(metrics.growth))}%
                        </span>
                        {' vs last month'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className='relative flex items-start gap-3 rounded-lg border bg-card p-4'>
                <div className='flex size-8 items-center justify-center rounded-lg bg-primary/10'>
                  <Phone className='size-4 text-primary' />
                </div>
                <div className='min-w-0 flex-1'>
                  <div className='flex items-center gap-1'>
                    <p className='text-muted-foreground text-sm'>{t('contacted_leads')}</p>
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
                    <p className='truncate font-semibold text-2xl'>{metrics?.contacted || 0}</p>
                    <p className='text-muted-foreground text-xs'>{(((metrics?.contacted || 0) / (metrics?.total || 1)) * 100).toFixed(0)}% of total</p>
                  </div>
                </div>
              </div>

              <div className='relative flex items-start gap-3 rounded-lg border bg-card p-4'>
                <div className='flex size-8 items-center justify-center rounded-lg bg-primary/10'>
                  <CheckCircle className='size-4 text-primary' />
                </div>
                <div className='min-w-0 flex-1'>
                  <div className='flex items-center gap-1'>
                    <p className='text-muted-foreground text-sm'>{t('qualified_leads')}</p>
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
                    <p className='truncate font-semibold text-2xl'>{metrics?.qualified || 0}</p>
                    <p className='text-muted-foreground text-xs'>{(((metrics?.qualified || 0) / (metrics?.total || 1)) * 100).toFixed(0)}% of total</p>
                  </div>
                </div>
              </div>

              <div className='relative flex items-start gap-3 rounded-lg border bg-card p-4'>
                <div className='flex size-8 items-center justify-center rounded-lg bg-primary/10'>
                  <Flame className='size-4 text-primary' />
                </div>
                <div className='min-w-0 flex-1'>
                  <div className='flex items-center gap-1'>
                    <p className='text-muted-foreground text-sm'>{t('hot_leads')}</p>
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
                    <p className='truncate font-semibold text-2xl'>{metrics?.hot || 0}</p>
                    <p className='text-muted-foreground text-xs'>{(((metrics?.hot || 0) / (metrics?.total || 1)) * 100).toFixed(0)}% of total</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart Section */}
            <div className='flex-1 rounded-lg border bg-card p-6'>
              <div className='mb-4 flex items-center gap-2'>
                <BarChart2 className='size-5 text-primary' />
                <h2 className='font-medium'>{t('monthly_lead_growth')}</h2>
              </div>
              <ChartContainer config={chartConfig}>
                <AreaChart
                  accessibilityLayer
                  data={chartData}
                  margin={{
                    left: 12,
                    right: 12,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey='month' tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value.slice(0, 3)} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator='line' />} />
                  <Area dataKey='leads' type='natural' fill='var(--color-leads)' fillOpacity={0.4} stroke='var(--color-leads)' />
                </AreaChart>
              </ChartContainer>
              <div className='mt-4 flex w-full items-start gap-2 text-sm'>
                <div className='grid gap-2'>
                  <div className='flex items-center gap-2 font-medium leading-none'>
                    {t('trending_up_by', { percentage: metrics?.growth || 0 })} <TrendingUp className='h-4 w-4' />
                  </div>
                  <div className='flex items-center gap-2 text-muted-foreground leading-none'>
                    {format(subMonths(new Date(), 5), 'MMMM')} - {format(new Date(), 'MMMM yyyy')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Status Breakdown */}
          <div className='w-full rounded-lg border bg-card p-6 lg:w-1/3'>
            <div className='mb-4 flex items-center gap-2'>
              <PieChart className='size-5 text-primary' />
              <h2 className='font-medium'>{t('leads_by_status')}</h2>
            </div>
            <div className='space-y-4'>
              {statusData.map((status) => (
                <div key={status.status} className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <div className='size-3 rounded-full' style={{ backgroundColor: status.color }} />
                    <span className='text-sm'>{status.status}</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <span className='font-medium text-sm'>{status.value}</span>
                    <span className='text-muted-foreground text-xs'>{((status.value / (metrics?.total || 1)) * 100).toFixed(0)}%</span>
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
