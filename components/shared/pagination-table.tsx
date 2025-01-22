'use client';

import { TableLoading } from '@/components/shared/table-loading';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { type ColumnDef, type Table as TableType, flexRender } from '@tanstack/react-table';

interface PaginationTableProps<TData> {
  table: TableType<TData>;
  columns: ColumnDef<TData, any>[];
  loading?: boolean;
  onRowClick?: (row: TData) => void;
  rowClassName?: string;
}

export function PaginationTable<TData>({ table, columns, loading, onRowClick, rowClassName }: PaginationTableProps<TData>) {
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
          <div className='relative'>
            <div className='max-h-[800px] overflow-auto'>
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>
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
                        No results.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      <div className='flex items-center justify-between'>
        <div className='flex-1 text-sm text-muted-foreground'>
          {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className='flex items-center space-x-6'>
          <span className='text-sm text-muted-foreground'>
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <div className='space-x-2'>
            <Button variant='outline' size='sm' onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              Previous
            </Button>
            <Button variant='outline' size='sm' onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
