'use client';

import { format, parseISO, subMonths } from 'date-fns';
import {
  Activity,
  AlertTriangle,
  BarChart2,
  Building2,
  CheckCircle,
  Clock,
  Eye,
  Flame,
  HelpCircle,
  Mail,
  MessageSquare,
  Phone,
  PieChart,
  Plus,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { PageHeader } from '@/components/shared/page-header';
import { PageLoading } from '@/components/shared/page-loading';
import { SmartColorBadge } from '@/components/shared/smart-color-badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ActivitySubType } from '@/lib/schema';
import type { Locale } from '@/types/i18n';
import { renderDescription } from '@/utils/activity';
import { formatDate } from '@/utils/date';
import { api } from '@/utils/trpc/client';

// Helper function to get color from config
const getColorFromConfig = (
  value: string,
  items: { value: string; color: string }[]
) => {
  return items.find((item) => item.value === value)?.color || '#6B7280';
};

export default function Dashboard() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const { data: session, status } = useSession();

  // Fetch dashboard metrics and configurations in parallel
  const { data: dashboardData, isLoading: isMetricsLoading } =
    api.contact.getDashboardMetrics.useQuery({
      dateRange: 'this-month',
    });

  const { data: configurations, isLoading: isConfigLoading } =
    api.contact.getAllConfigurations.useQuery();

  // Fetch additional dashboard data
  const { data: recentActivities, isLoading: isActivitiesLoading } =
    api.contact.getRecentActivities.useQuery({ limit: 8 });

  const { data: overdueFollowUps, isLoading: isOverdueLoading } =
    api.contact.getOverdueFollowUps.useQuery({ limit: 5 });

  const { data: recentContacts, isLoading: isRecentContactsLoading } =
    api.contact.getRecentContacts.useQuery({ limit: 6 });

  const { data: topCompanies, isLoading: isTopCompaniesLoading } =
    api.contact.getTopCompanies.useQuery({ limit: 8 });

  const { data: performanceMetrics, isLoading: isPerformanceLoading } =
    api.contact.getPerformanceMetrics.useQuery();

  const isLoading = isMetricsLoading || isConfigLoading;

  // Prepare data for monthly growth chart
  const chartData = useMemo(() => {
    if (!dashboardData?.monthlyData || dashboardData.monthlyData.length === 0) {
      // Return empty data for last 6 months if no data
      const defaultData = [];
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        defaultData.push({
          month: format(date, 'MMMM'),
          leads: 0,
        });
      }
      return defaultData;
    }

    return dashboardData.monthlyData.map((item) => ({
      month: format(parseISO(`${item.month}-01`), 'MMMM'),
      leads: Number(item.count) || 0,
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
    if (!dashboardData?.priorityBreakdown || !configurations?.priorities)
      return [];

    return dashboardData.priorityBreakdown
      .filter((item) => item.priority !== null)
      .map((item) => ({
        status: item.priority || 'Medium',
        value: item.count,
        color: getColorFromConfig(
          item.priority || 'Medium',
          configurations.priorities
        ),
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
        color: getColorFromConfig(
          item.source || 'Other',
          configurations.sources
        ),
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
          <PageHeader
            title={t('welcome_back', { name: session?.user?.name || '' })}
          />
          <div className='flex gap-2'>
            <Button asChild size='sm'>
              <Link href='/dashboard/crm/contacts/new'>
                <Plus className='mr-2 h-4 w-4' />
                {t('add_contact')}
              </Link>
            </Button>
          </div>
        </div>

        {/* Overview Metrics Grid */}
        <div className='mb-6 grid grid-cols-2 gap-4 lg:grid-cols-6'>
          <div className='relative flex items-start gap-3 rounded-lg border bg-card p-4'>
            <div className='flex size-8 items-center justify-center rounded-lg bg-primary/10'>
              <Users className='size-4 text-primary' />
            </div>
            <div className='min-w-0 flex-1'>
              <div className='flex items-center gap-1'>
                <p className='text-muted-foreground text-sm'>
                  {t('total_leads')}
                </p>
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
                <p className='truncate font-semibold text-2xl'>
                  {metrics?.total || 0}
                </p>
                {metrics?.growth && (
                  <p className='text-muted-foreground text-xs'>
                    <span
                      className={
                        Number(metrics.growth) > 0
                          ? 'text-green-500'
                          : Number(metrics.growth) < 0
                            ? 'text-red-500'
                            : ''
                      }
                    >
                      {Number(metrics.growth) > 0
                        ? '↑'
                        : Number(metrics.growth) < 0
                          ? '↓'
                          : ''}{' '}
                      {Math.abs(Number(metrics.growth))}%
                    </span>
                    {' vs last month'}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className='relative flex items-start gap-3 rounded-lg border bg-card p-4'>
            <div className='flex size-8 items-center justify-center rounded-lg bg-blue-500/10'>
              <Phone className='size-4 text-blue-500' />
            </div>
            <div className='min-w-0 flex-1'>
              <p className='text-muted-foreground text-sm'>
                {t('contacted_leads')}
              </p>
              <div className='mt-1'>
                <p className='truncate font-semibold text-2xl'>
                  {metrics?.contacted || 0}
                </p>
                <p className='text-muted-foreground text-xs'>
                  {performanceMetrics?.conversion.contactRate || 0}% rate
                </p>
              </div>
            </div>
          </div>

          <div className='relative flex items-start gap-3 rounded-lg border bg-card p-4'>
            <div className='flex size-8 items-center justify-center rounded-lg bg-green-500/10'>
              <CheckCircle className='size-4 text-green-500' />
            </div>
            <div className='min-w-0 flex-1'>
              <p className='text-muted-foreground text-sm'>
                {t('qualified_leads')}
              </p>
              <div className='mt-1'>
                <p className='truncate font-semibold text-2xl'>
                  {metrics?.qualified || 0}
                </p>
                <p className='text-muted-foreground text-xs'>
                  {performanceMetrics?.conversion.qualificationRate || 0}% rate
                </p>
              </div>
            </div>
          </div>

          <div className='relative flex items-start gap-3 rounded-lg border bg-card p-4'>
            <div className='flex size-8 items-center justify-center rounded-lg bg-red-500/10'>
              <Flame className='size-4 text-red-500' />
            </div>
            <div className='min-w-0 flex-1'>
              <p className='text-muted-foreground text-sm'>{t('hot_leads')}</p>
              <div className='mt-1'>
                <p className='truncate font-semibold text-2xl'>
                  {metrics?.hot || 0}
                </p>
                <p className='text-muted-foreground text-xs'>
                  {(
                    ((metrics?.hot || 0) / (metrics?.total || 1)) *
                    100
                  ).toFixed(0)}
                  % of total
                </p>
              </div>
            </div>
          </div>

          <div className='relative flex items-start gap-3 rounded-lg border bg-card p-4'>
            <div className='flex size-8 items-center justify-center rounded-lg bg-orange-500/10'>
              <AlertTriangle className='size-4 text-orange-500' />
            </div>
            <div className='min-w-0 flex-1'>
              <p className='text-muted-foreground text-sm'>Overdue</p>
              <div className='mt-1'>
                <p className='truncate font-semibold text-2xl'>
                  {overdueFollowUps?.length || 0}
                </p>
                <p className='text-muted-foreground text-xs'>Follow-ups</p>
              </div>
            </div>
          </div>

          <div className='relative flex items-start gap-3 rounded-lg border bg-card p-4'>
            <div className='flex size-8 items-center justify-center rounded-lg bg-purple-500/10'>
              <Activity className='size-4 text-purple-500' />
            </div>
            <div className='min-w-0 flex-1'>
              <p className='text-muted-foreground text-sm'>This Week</p>
              <div className='mt-1'>
                <p className='truncate font-semibold text-2xl'>
                  {performanceMetrics?.activity.recentActivity || 0}
                </p>
                <p className='text-muted-foreground text-xs'>Activities</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - 3 Column Layout */}
        <div className='flex flex-1 gap-6'>
          {/* Left Column - Chart & Performance */}
          <div className='w-full space-y-6 lg:w-1/2'>
            {/* Chart Section */}
            <Card>
              <CardHeader>
                <div className='flex items-center gap-2'>
                  <BarChart2 className='size-5 text-primary' />
                  <CardTitle className='text-lg'>
                    {t('monthly_lead_growth')}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
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
                    <XAxis
                      dataKey='month'
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value) =>
                        typeof value === 'string' ? value.slice(0, 3) : ''
                      }
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator='line' />}
                    />
                    <Area
                      dataKey='leads'
                      type='natural'
                      fill='var(--color-leads)'
                      fillOpacity={0.4}
                      stroke='var(--color-leads)'
                    />
                  </AreaChart>
                </ChartContainer>
                <div className='mt-4 flex w-full items-start gap-2 text-sm'>
                  <div className='grid gap-2'>
                    <div className='flex items-center gap-2 font-medium leading-none'>
                      {t('trending_up_by', {
                        percentage: metrics?.growth || 0,
                      })}{' '}
                      <TrendingUp className='h-4 w-4' />
                    </div>
                    <div className='flex items-center gap-2 text-muted-foreground leading-none'>
                      {chartData.length > 0 &&
                        `${chartData[0].month} - ${chartData[chartData.length - 1].month}`}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <div className='flex items-center gap-2'>
                  <TrendingUp className='size-5 text-primary' />
                  <CardTitle className='text-lg'>
                    Performance Overview
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='flex items-center gap-3'>
                    <Mail className='size-4 text-blue-500' />
                    <div>
                      <p className='font-medium text-sm'>
                        {performanceMetrics?.activity.totalEmails || 0}
                      </p>
                      <p className='text-muted-foreground text-xs'>
                        Emails Sent
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-3'>
                    <MessageSquare className='size-4 text-green-500' />
                    <div>
                      <p className='font-medium text-sm'>
                        {performanceMetrics?.activity.totalNotes || 0}
                      </p>
                      <p className='text-muted-foreground text-xs'>
                        Notes Added
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-3'>
                    <Clock className='size-4 text-purple-500' />
                    <div>
                      <p className='font-medium text-sm'>
                        {performanceMetrics?.activity.totalMeetings || 0}
                      </p>
                      <p className='text-muted-foreground text-xs'>Meetings</p>
                    </div>
                  </div>
                  <div className='flex items-center gap-3'>
                    <CheckCircle className='size-4 text-orange-500' />
                    <div>
                      <p className='font-medium text-sm'>
                        {performanceMetrics?.conversion.closed || 0}
                      </p>
                      <p className='text-muted-foreground text-xs'>Closed</p>
                    </div>
                  </div>
                </div>

                {/* Industry Breakdown */}
                {performanceMetrics?.industries &&
                  performanceMetrics.industries.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className='mb-2 font-medium text-sm'>
                          Top Industries
                        </h4>
                        <div className='space-y-2'>
                          {performanceMetrics.industries.map(
                            (industry, idx) => (
                              <div
                                key={idx}
                                className='flex items-center justify-between'
                              >
                                <span className='text-sm'>
                                  {industry.industry}
                                </span>
                                <Badge variant='outline' className='text-xs'>
                                  {industry.count}
                                </Badge>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </>
                  )}
              </CardContent>
            </Card>
          </div>

          {/* Middle Column - Activities & Follow-ups */}
          <div className='w-full space-y-6 lg:w-1/3'>
            {/* Overdue Follow-ups */}
            {overdueFollowUps && overdueFollowUps.length > 0 && (
              <Card>
                <CardHeader>
                  <div className='flex items-center gap-2'>
                    <AlertTriangle className='size-5 text-orange-500' />
                    <CardTitle className='text-lg'>
                      Overdue Follow-ups
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    {overdueFollowUps.slice(0, 5).map((contact) => (
                      <div
                        key={contact.id}
                        className='flex items-center justify-between rounded-lg border bg-orange-50 p-2 dark:bg-orange-950/20'
                      >
                        <div className='flex items-center gap-3'>
                          <Avatar className='size-8'>
                            <AvatarFallback className='text-xs'>
                              {contact.name
                                ?.split(' ')
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2) || 'UN'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className='font-medium text-sm'>
                              {contact.name}
                            </p>
                            <p className='text-muted-foreground text-xs'>
                              Due:{' '}
                              {contact.nextFollowUpAt
                                ? formatDate(
                                    new Date(contact.nextFollowUpAt),
                                    locale
                                  )
                                : 'N/A'}
                            </p>
                          </div>
                        </div>
                        <Button asChild size='sm' variant='outline'>
                          <Link href={`/dashboard/crm/contacts/${contact.id}`}>
                            <Eye className='h-3 w-3' />
                          </Link>
                        </Button>
                      </div>
                    ))}
                    {overdueFollowUps.length > 5 && (
                      <Button
                        asChild
                        variant='ghost'
                        size='sm'
                        className='w-full'
                      >
                        <Link href='/dashboard/crm/contacts?filter=overdue'>
                          View all {overdueFollowUps.length} overdue
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Activities */}
            <Card className='flex-1'>
              <CardHeader>
                <div className='flex items-center gap-2'>
                  <Activity className='size-5 text-primary' />
                  <CardTitle className='text-lg'>Recent Activities</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {!isActivitiesLoading &&
                  recentActivities &&
                  recentActivities.length > 0 ? (
                    recentActivities.map((activity) => (
                      <div
                        key={activity.id}
                        className='flex items-start gap-3 rounded-lg p-2 hover:bg-muted/50'
                      >
                        <Avatar className='size-7'>
                          <AvatarFallback className='text-xs'>
                            {activity.contact?.name
                              ?.split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2) || 'UN'}
                          </AvatarFallback>
                        </Avatar>
                        <div className='min-w-0 flex-1'>
                          <div className='flex items-start justify-between'>
                            <p className='text-sm leading-relaxed'>
                              {renderDescription(
                                {
                                  ...activity,
                                  description: activity.description || '',
                                  metadata: activity.metadata as string,
                                  initiatorType: 'user',
                                  subType: activity.subType as ActivitySubType,
                                },
                                t,
                                locale
                              )}
                            </p>
                            <span className='ml-2 whitespace-nowrap text-muted-foreground text-xs'>
                              {formatDate(
                                new Date(activity.createdAt),
                                locale,
                                true
                              )}
                            </span>
                          </div>
                          <Button
                            asChild
                            variant='ghost'
                            size='sm'
                            className='mt-1 h-6 px-2'
                          >
                            <Link
                              href={`/dashboard/crm/contacts/${activity.contact?.id}`}
                            >
                              View Contact
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className='text-muted-foreground text-sm'>
                      No recent activities
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Lead Breakdowns & Company Data */}
          <div className='w-full space-y-6 lg:w-1/3'>
            {/* Recent Contacts */}
            <Card>
              <CardHeader>
                <div className='flex items-center gap-2'>
                  <UserPlus className='size-5 text-primary' />
                  <CardTitle className='text-lg'>Recent Contacts</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {!isRecentContactsLoading &&
                  recentContacts &&
                  recentContacts.length > 0 ? (
                    recentContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className='flex items-center justify-between'
                      >
                        <div className='flex items-center gap-3'>
                          <Avatar className='size-8'>
                            <AvatarFallback className='text-xs'>
                              {contact.name
                                ?.split(' ')
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2) || 'UN'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className='font-medium text-sm'>
                              {contact.name}
                            </p>
                            <p className='text-muted-foreground text-xs'>
                              {contact.company || 'No company'}
                            </p>
                          </div>
                        </div>
                        <div className='flex items-center gap-2'>
                          <SmartColorBadge
                            value={contact.status}
                            color={getColorFromConfig(
                              contact.status,
                              configurations?.statuses || []
                            )}
                            hoverEffect={false}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className='text-muted-foreground text-sm'>
                      No recent contacts
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Companies */}
            <Card>
              <CardHeader>
                <div className='flex items-center gap-2'>
                  <Building2 className='size-5 text-primary' />
                  <CardTitle className='text-lg'>Top Companies</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {!isTopCompaniesLoading &&
                  topCompanies &&
                  topCompanies.length > 0 ? (
                    topCompanies.map((company, idx) => (
                      <div
                        key={idx}
                        className='flex items-center justify-between'
                      >
                        <div>
                          <p className='font-medium text-sm'>
                            {company.company}
                          </p>
                          <p className='text-muted-foreground text-xs'>
                            {company.qualifiedCount} qualified •{' '}
                            {company.hotCount} hot
                          </p>
                        </div>
                        <Badge variant='outline'>{company.count}</Badge>
                      </div>
                    ))
                  ) : (
                    <p className='text-muted-foreground text-sm'>
                      No company data
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Lead Breakdowns */}
            <Card className='flex-1'>
              <CardHeader>
                <div className='flex items-center gap-2'>
                  <PieChart className='size-5 text-primary' />
                  <CardTitle className='text-lg'>
                    {t('leads_breakdown')}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className='flex-1'>
                <Tabs defaultValue='status' className='h-full w-full'>
                  <TabsList className='grid w-full grid-cols-3'>
                    <TabsTrigger value='status'>{t('status')}</TabsTrigger>
                    <TabsTrigger value='priority'>{t('priority')}</TabsTrigger>
                    <TabsTrigger value='resource'>{t('resource')}</TabsTrigger>
                  </TabsList>
                  <TabsContent value='status' className='mt-4 space-y-3'>
                    {statusData.map((item) => (
                      <div
                        key={item.status}
                        className='flex items-center justify-between'
                      >
                        <div className='flex items-center gap-2'>
                          <SmartColorBadge
                            value={item.status}
                            color={item.color}
                            hoverEffect={false}
                          />
                        </div>
                        <div className='flex items-center gap-2'>
                          <span className='font-medium text-sm'>
                            {item.value}
                          </span>
                          <span className='text-muted-foreground text-xs'>
                            {(
                              (item.value / (metrics?.total || 1)) *
                              100
                            ).toFixed(0)}
                            %
                          </span>
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                  <TabsContent value='priority' className='mt-4 space-y-3'>
                    {priorityData.map((item) => (
                      <div
                        key={item.status}
                        className='flex items-center justify-between'
                      >
                        <div className='flex items-center gap-2'>
                          <SmartColorBadge
                            value={item.status}
                            color={item.color}
                            hoverEffect={false}
                          />
                        </div>
                        <div className='flex items-center gap-2'>
                          <span className='font-medium text-sm'>
                            {item.value}
                          </span>
                          <span className='text-muted-foreground text-xs'>
                            {(
                              (item.value / (metrics?.total || 1)) *
                              100
                            ).toFixed(0)}
                            %
                          </span>
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                  <TabsContent value='resource' className='mt-4 space-y-3'>
                    {sourceData.map((item) => (
                      <div
                        key={item.status}
                        className='flex items-center justify-between'
                      >
                        <div className='flex items-center gap-2'>
                          <SmartColorBadge
                            value={item.status}
                            color={item.color}
                            hoverEffect={false}
                          />
                        </div>
                        <div className='flex items-center gap-2'>
                          <span className='font-medium text-sm'>
                            {item.value}
                          </span>
                          <span className='text-muted-foreground text-xs'>
                            {(
                              (item.value / (metrics?.total || 1)) *
                              100
                            ).toFixed(0)}
                            %
                          </span>
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
