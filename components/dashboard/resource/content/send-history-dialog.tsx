'use client';

import { DataTable } from '@/components/shared/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { ResourceContent } from '@/lib/schema';
import { api } from '@/utils/trpc/client';
import { type ColumnDef, type SortingState, getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import { formatDistanceToNow } from 'date-fns';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

interface SendHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: ResourceContent;
}

type SendHistoryRecord = {
  id: string;
  sentAt: Date;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  metadata: string | null;
  contact: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
  sentBy: {
    id: string;
    name: string | null;
  } | null;
};

export function SendHistoryDialog({ open, onOpenChange, content }: SendHistoryDialogProps) {
  const t = useTranslations();
  const [sorting, setSorting] = useState<SortingState>([]);

  const { data: sendHistory, isLoading } = api.resource.getContentSendHistory.useQuery(
    { resourceId: content.id },
    {
      enabled: open,
    }
  );

  const columns = useMemo<ColumnDef<SendHistoryRecord>[]>(
    () => [
      {
        accessorFn: (row) => row.contact?.name || '',
        header: t('recipient'),
        enableSorting: true,
        enableHiding: false,
      },
      {
        accessorFn: (row) => row.contact?.email || '',
        header: t('email'),
        enableSorting: true,
        enableHiding: false,
      },
      {
        accessorKey: 'sentAt',
        header: t('sent_at'),
        cell: ({ row }) => formatDistanceToNow(new Date(row.original.sentAt), { addSuffix: true }),
        enableSorting: true,
        enableHiding: false,
      },
      {
        accessorFn: (row) => row.sentBy?.name || '',
        header: t('sent_by'),
        enableSorting: true,
        enableHiding: false,
      },
      {
        accessorKey: 'status',
        header: t('status'),
        cell: ({ row }) => <span>{t(row.original.status)}</span>,
        enableSorting: true,
        enableHiding: false,
      },
    ],
    [t]
  );

  const table = useReactTable({
    data: (sendHistory || []) as SendHistoryRecord[],
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] max-w-4xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{t('send_history')}</DialogTitle>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='font-medium'>{content.title}</h3>
              {content.description && <p className='text-muted-foreground text-sm'>{content.description}</p>}
            </div>
          </div>

          <DataTable table={table} columns={columns} loading={isLoading} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
