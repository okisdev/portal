'use client';

import { TableLoading } from '@/components/shared/table-loading';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { type ColumnDef, type Table as TableType, flexRender } from '@tanstack/react-table';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface PaginationTableProps<TData> {
  table: TableType<TData>;
  columns: ColumnDef<TData, any>[];
  loading?: boolean;
  onRowClick?: (row: TData) => void;
  rowClassName?: string;
}

export function PaginationTable<TData>({ table, columns, loading, onRowClick, rowClassName }: PaginationTableProps<TData>) {
  const t = useTranslations();

  const handleRowClick = (e: React.MouseEvent, row: TData) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-checkbox-cell]')) {
      return;
    }
    onRowClick?.(row);
  };

  return (
    <div className='space-y-4'>
      <div className='rounded-md border'>
        {loading ? (
          <TableLoading columnCount={columns.length} rowCount={13} />
        ) : (
          <div className='relative max-h-[800px] overflow-auto'>
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder ? null : (
                          <div
                            className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
                            onClick={header.column.getToggleSortingHandler()}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                header.column.toggleSorting();
                              }
                            }}
                            tabIndex={header.column.getCanSort() ? 0 : undefined}
                            role={header.column.getCanSort() ? 'button' : undefined}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getCanSort() ? (
                              header.column.getIsSorted() ? (
                                {
                                  asc: <ChevronUp className='ml-2 inline h-4 w-4' />,
                                  desc: <ChevronDown className='ml-2 inline h-4 w-4' />,
                                }[header.column.getIsSorted() as string]
                              ) : (
                                <ChevronsUpDown className='ml-2 inline h-4 w-4' />
                              )
                            ) : null}
                          </div>
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} className={rowClassName} onClick={(e) => handleRowClick(e, row.original)}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} data-checkbox-cell={cell.column.id === 'select' ? true : undefined}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className='h-24 text-center'>
                      {t('no_results')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className='flex items-center justify-between'>
        <div className='flex-1 text-muted-foreground text-sm'>
          {t('number_of_rows_selected', { number: table.getFilteredSelectedRowModel().rows.length, total: table.getFilteredRowModel().rows.length })}
        </div>
        <div className='flex items-center space-x-6'>
          <span className='text-muted-foreground text-sm'>{t('page_of_number', { page: table.getState().pagination.pageIndex + 1, total: table.getPageCount() })}</span>
          <div className='space-x-2'>
            <Button variant='outline' size='sm' onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              {t('previous')}
            </Button>
            <Button variant='outline' size='sm' onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              {t('next')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
