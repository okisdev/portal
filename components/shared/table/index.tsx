'use client';

import {
  type ColumnDef,
  flexRender,
  type Table as TableType,
} from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { TableLoading } from '@/components/shared/table/loading';
import { DataTablePagination } from '@/components/shared/table/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface PaginationTableProps<TData> {
  table: TableType<TData>;
  columns: ColumnDef<TData, any>[];
  loading?: boolean;
  onRowClick?: (row: TData) => void;
}

export function DataTable<TData>({
  table,
  columns,
  loading,
  onRowClick,
}: PaginationTableProps<TData>) {
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
          <div className='relative overflow-auto'>
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead colSpan={header.colSpan} key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      data-state={row.getIsSelected() && 'selected'}
                      key={row.id}
                      onClick={(e) => handleRowClick(e, row.original)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          data-checkbox-cell={
                            cell.column.id === 'select' ? true : undefined
                          }
                          key={cell.id}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      className='h-24 text-center'
                      colSpan={columns.length}
                    >
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
