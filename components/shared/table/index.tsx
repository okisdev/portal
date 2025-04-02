'use client';

import { TableLoading } from '@/components/shared/table/loading';
import { DataTablePagination } from '@/components/shared/table/pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { type ColumnDef, type Table as TableType, flexRender } from '@tanstack/react-table';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface PaginationTableProps<TData> {
  table: TableType<TData>;
  columns: ColumnDef<TData, any>[];
  loading?: boolean;
  onRowClick?: (row: TData) => void;
}

export function DataTable<TData>({ table, columns, loading, onRowClick }: PaginationTableProps<TData>) {
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
          <TableLoading columnCount={columns.length} />
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
                    <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} onClick={(e) => handleRowClick(e, row.original)}>
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

      <DataTablePagination table={table} />
    </div>
  );
}
