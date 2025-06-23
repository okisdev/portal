'use client';

import { PageHeader } from '@/components/shared/page-header';
import { PageLoading } from '@/components/shared/page-loading';
import { SmartColorBadge } from '@/components/shared/smart-color-badge';
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { api } from '@/utils/trpc/client';
import { format, parseISO } from 'date-fns';
import { BarChart2, CheckCircle, Flame, HelpCircle, Phone, PieChart, TrendingUp, Users } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

export default function Dashboard() {
  const t = useTranslations();
  const { data: session, status } = useSession();

  // Fetch dashboard metrics and configurations in parallel
  const { data: dashboardData, isLoading: isMetricsLoading } = api.contact.getDashboardMetrics.useQuery({
    dateRange: 'this-month',
  });

  const { data: configurations, isLoading: isConfigLoading } = api.contact.getAllConfigurations.useQuery();

  const isLoading = isMetricsLoading || isConfigLoading;

  // Helper function to get color from config
  const getColorFromConfig = (value: string, items: { value: string; color: string }[]) => {
    return items.find((item) => item.value === value)?.color || '#6B7280';
  };

  // Prepare data for monthly growth chart
  const chartData = useMemo(() => {
    if (!dashboardData?.monthlyData) return [];

    return dashboardData.monthlyData.map((item) => ({
      month: format(parseISO(`${item.month}-01`), 'MMMM'),
      leads: item.count,
    }));
  }, [dashboardData?.monthlyData]);

  const chartConfig = {
    leads: {
      label: t('leads'),
      color: 'var(--chart-1)',
    },
  } satisfies ChartConfig;

  // Prepare data for status breakdown
  const statusData = useMemo(() => {
    if (!dashboardData?.statusBreakdown || !configurations?.statuses) return [];

    return dashboardData.statusBreakdown.map((item) => ({
      status: item.status,
      value: item.count,
      color: getColorFromConfig(item.status, configurations.statuses),
    }));
  }, [dashboardData?.statusBreakdown, configurations?.statuses]);

  // Prepare data for priority breakdown
  const priorityData = useMemo(() => {
    if (!dashboardData?.priorityBreakdown || !configurations?.priorities) return [];

    return dashboardData.priorityBreakdown
      .filter((item) => item.priority !== null)
      .map((item) => ({
        status: item.priority || 'Medium',
        value: item.count,
        color: getColorFromConfig(item.priority || 'Medium', configurations.priorities),
      }));
  }, [dashboardData?.priorityBreakdown, configurations?.priorities]);

  // Prepare data for source breakdown
  const sourceData = useMemo(() => {
    if (!dashboardData?.sourceBreakdown || !configurations?.sources) return [];

    return dashboardData.sourceBreakdown
      .filter((item) => item.source !== null)
      .map((item) => ({
        status: item.source || 'Other',
        value: item.count,
        color: getColorFromConfig(item.source || 'Other', configurations.sources),
      }));
  }, [dashboardData?.sourceBreakdown, configurations?.sources]);

  if (status === 'loading' || isLoading) {
    return <PageLoading />;
  }

  const metrics = dashboardData?.metrics;

  return (
    <div className='container mx-auto h-[calc(100vh-4rem)] p-4'>
      <div className='flex h-full flex-col'>
        <div className='mb-6 flex items-center justify-between'>
          <PageHeader title={t('welcome_back', { name: session?.user?.name || '' })} />
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
                  <div className='flex items-center gap-2 text-muted-foreground leading-none'>{chartData.length > 0 && `${chartData[0].month} - ${chartData[chartData.length - 1].month}`}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Lead Breakdowns */}
          <div className='w-full rounded-lg border bg-card p-6 lg:w-1/3'>
            <div className='mb-4 flex items-center gap-2'>
              <PieChart className='size-5 text-primary' />
              <h2 className='font-medium'>{t('leads_breakdown')}</h2>
            </div>
            <Tabs defaultValue='status' className='w-full'>
              <TabsList className='grid w-full grid-cols-3'>
                <TabsTrigger value='status'>{t('status')}</TabsTrigger>
                <TabsTrigger value='priority'>{t('priority')}</TabsTrigger>
                <TabsTrigger value='resource'>{t('resource')}</TabsTrigger>
              </TabsList>
              <TabsContent value='status' className='mt-4 space-y-4'>
                {statusData.map((item) => (
                  <div key={item.status} className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <SmartColorBadge value={item.status} color={item.color} hoverEffect={false} />
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='font-medium text-sm'>{item.value}</span>
                      <span className='text-muted-foreground text-xs'>{((item.value / (metrics?.total || 1)) * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </TabsContent>
              <TabsContent value='priority' className='mt-4 space-y-4'>
                {priorityData.map((item) => (
                  <div key={item.status} className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <SmartColorBadge value={item.status} color={item.color} hoverEffect={false} />
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='font-medium text-sm'>{item.value}</span>
                      <span className='text-muted-foreground text-xs'>{((item.value / (metrics?.total || 1)) * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </TabsContent>
              <TabsContent value='resource' className='mt-4 space-y-4'>
                {sourceData.map((item) => (
                  <div key={item.status} className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <SmartColorBadge value={item.status} color={item.color} hoverEffect={false} />
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='font-medium text-sm'>{item.value}</span>
                      <span className='text-muted-foreground text-xs'>{((item.value / (metrics?.total || 1)) * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
