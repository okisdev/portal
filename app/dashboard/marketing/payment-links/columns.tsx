'use client';

import { Badge } from '@/components/ui/badge';
import { CopyButton } from '@/components/ui/copy-button';
import { formatDate } from '@/lib/utils';
import type { ColumnDef } from '@tanstack/react-table';
import type { PaymentLink } from './types';

export const columns: ColumnDef<PaymentLink>[] = [
  {
    accessorKey: 'contact.name',
    header: 'Contact',
    cell: ({ row }) => (
      <div>
        <div>{row.original.contact.name}</div>
        <div className='text-muted-foreground text-sm'>{row.original.contact.email}</div>
      </div>
    ),
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => {
      const amount = Number.parseFloat(row.getValue('amount'));
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: row.original.currency,
      }).format(amount / 100);
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return <Badge variant={status === 'paid' ? 'default' : status === 'pending' ? 'secondary' : status === 'failed' ? 'destructive' : 'outline'}>{status}</Badge>;
    },
  },
  {
    accessorKey: 'linkClicked',
    header: 'Clicked',
    cell: ({ row }) => (row.getValue('linkClicked') ? 'Yes' : 'No'),
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => formatDate(row.getValue('createdAt')),
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      'use client';
      const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/track?id=${row.original.id}`;
      return (
        <CopyButton value={trackingUrl} className='h-8 px-3'>
          Copy Link
        </CopyButton>
      );
    },
  },
];
