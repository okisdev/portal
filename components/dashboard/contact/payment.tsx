import { ContentWithCopy } from '@/components/shared/content-with-copy';
import { MetadataPopover } from '@/components/shared/metadata-popover';
import { Skeleton } from '@/components/ui/skeleton';
import type { Contact } from '@/lib/schema';
import { cn, formatDate, isDev } from '@/lib/utils';
import { api } from '@/utils/trpc/client';
import { ExternalLink, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

interface PaymentProps {
  contact: Partial<Contact>;
}

export function Payment({ contact }: PaymentProps) {
  const t = useTranslations();

  const { data: stripeCustomerInfo, isLoading } = api.pay.getContactStripeCustomerInfo.useQuery(
    { email: contact?.email || '', phone: contact?.phone || '' },
    { enabled: !!contact?.email || !!contact?.phone }
  );

  return (
    <div className='space-y-2 border-b p-6'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          {stripeCustomerInfo ? (
            <Link
              href={isDev() ? `https://dashboard.stripe.com/test/customers/${stripeCustomerInfo?.customer.id}` : `https://dashboard.stripe.com/customers/${stripeCustomerInfo?.customer.id}`}
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center gap-2 text-muted-foreground hover:text-foreground'
            >
              <h2 className='font-medium text-foreground'>{t('payments')}</h2>
              <ExternalLink className='size-4' />
            </Link>
          ) : (
            <h2 className='font-medium text-foreground'>{t('payments')}</h2>
          )}
          {stripeCustomerInfo && (
            <MetadataPopover title={t('customer_info')} align='start'>
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground text-xs'>{t('customer_id')}</span>
                  <ContentWithCopy content={stripeCustomerInfo.customer.id} className='font-mono text-xs' />
                </div>
                {stripeCustomerInfo.customer.default_source && (
                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground text-sm'>{t('payment_method')}</span>
                    <span className='font-mono text-sm'>
                      {typeof stripeCustomerInfo.customer.default_source === 'string' ? stripeCustomerInfo.customer.default_source : stripeCustomerInfo.customer.default_source.id}
                    </span>
                  </div>
                )}
              </div>
            </MetadataPopover>
          )}
        </div>
        <button type='button' className='text-muted-foreground hover:text-foreground'>
          <Plus className='size-4' />
        </button>
      </div>

      {isLoading && <Skeleton className='h-24' />}

      {stripeCustomerInfo?.stats && (
        <div className='space-y-4'>
          {stripeCustomerInfo.stats.totalStats.oneTimeCount > 0 && (
            <div className='rounded-lg border bg-muted/50 p-4'>
              <h3 className='mb-3 font-medium text-sm'>{t('one_time_payments')}</h3>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='text-muted-foreground text-xs'>{t('total_payments')}</p>
                  <p className='font-medium text-foreground'>{stripeCustomerInfo.stats.totalStats.oneTimeCount}</p>
                </div>
                {Object.entries(stripeCustomerInfo.stats.oneTime).map(([currency, data]: [string, any]) => (
                  <div key={currency}>
                    <p className='text-muted-foreground text-xs'>
                      {t('total_amount')} ({currency.toUpperCase()})
                    </p>
                    <p className='font-medium text-foreground'>
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: currency,
                      }).format(data.total)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stripeCustomerInfo.stats.totalStats.subscriptionCount > 0 && (
            <div className='rounded-lg border bg-muted/50 p-4'>
              <h3 className='mb-3 font-medium text-sm'>{t('subscriptions')}</h3>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='text-muted-foreground text-xs'>{t('total_subscriptions')}</p>
                  <p className='font-medium text-foreground'>{stripeCustomerInfo.stats.totalStats.subscriptionCount}</p>
                </div>
                <div>
                  <p className='text-muted-foreground text-xs'>{t('active_subscriptions')}</p>
                  <p className='font-medium text-foreground'>
                    {stripeCustomerInfo.stats.totalStats.activeSubscriptionCount}
                    {stripeCustomerInfo.activeSubscriptions.some((sub: any) => sub.cancelAtPeriodEnd) && (
                      <span className='ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'>{t('some_cancelling')}</span>
                    )}
                  </p>
                </div>
                {Object.entries(stripeCustomerInfo.stats.subscription).map(([currency, data]: [string, any]) => (
                  <div key={currency}>
                    <div>
                      <p className='text-muted-foreground text-xs'>
                        {t('monthly_recurring')} ({currency.toUpperCase()})
                      </p>
                      <p className='font-medium text-foreground'>
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: currency,
                        }).format(data.recurring)}
                      </p>
                    </div>
                    <div>
                      <p className='text-muted-foreground text-xs'>
                        {t('total_paid')} ({currency.toUpperCase()})
                      </p>
                      <p className='font-medium text-foreground'>
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: currency,
                        }).format(data.total)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className='space-y-2'>
        {(!stripeCustomerInfo?.recentPayments || stripeCustomerInfo.recentPayments.length === 0) && !isLoading ? (
          <p className='text-muted-foreground text-sm'>{t('no_payments_found')}</p>
        ) : (
          <p className='font-medium text-sm'>{t('recent_transactions')}</p>
        )}
        {stripeCustomerInfo?.recentPayments?.map((payment: any) => (
          <div key={payment.id} className='flex items-center justify-between rounded-md bg-muted/30 p-2'>
            <div className='flex flex-col justify-between gap-1'>
              <span className='text-muted-foreground text-xs'>{formatDate(new Date(payment.created * 1000))}</span>
              <div className='flex items-center gap-2'>
                <span
                  className={cn(
                    'rounded px-1.5 py-0.5 text-xs',
                    payment.type === 'subscription' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  )}
                >
                  {payment.description}
                </span>
              </div>
            </div>
            <div className='flex flex-col items-end gap-1'>
              <span className={cn('font-medium', payment.status === 'succeeded' || payment.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-destructive')}>
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: payment.currency,
                }).format(payment.amount)}
              </span>
              <span className='text-muted-foreground text-xs capitalize'>
                {payment.status} {payment.type === 'subscription' && 'currentPeriodEnd' in payment && payment.cancelAtPeriodEnd && `(${t('cancelled')})`}
              </span>
              {payment.type === 'subscription' && 'currentPeriodEnd' in payment && (
                <span className='text-muted-foreground text-xs'>
                  {payment.cancelAtPeriodEnd
                    ? t('will_cancel_at', { date: formatDate(new Date(payment.currentPeriodEnd * 1000)) })
                    : t('will_renew_at', { date: formatDate(new Date(payment.currentPeriodEnd * 1000)) })}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
