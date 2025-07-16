import type { Table } from '@tanstack/react-table';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
}

export function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  const t = useTranslations();

  return (
    <div className='flex items-center justify-between px-2'>
      <div className='flex-1 text-muted-foreground text-sm'>
        {t('number_of_rows_selected', {
          number: table.getFilteredSelectedRowModel().rows.length,
          total: table.getFilteredRowModel().rows.length,
        })}
      </div>
      <div className='flex items-center space-x-6 lg:space-x-8'>
        <div className='flex items-center space-x-2'>
          <p className='font-medium text-sm'>{t('rows_per_page')}</p>
          <Select
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
            value={`${table.getState().pagination.pageSize}`}
          >
            <SelectTrigger className='h-8 w-[70px]'>
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side='top'>
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='flex w-auto items-center justify-center font-medium text-sm'>
          {t('page_of_number', {
            page: table.getState().pagination.pageIndex + 1,
            total: table.getPageCount(),
          })}
        </div>
        <div className='flex items-center space-x-2'>
          <Button
            className='hidden h-8 w-8 p-0 lg:flex'
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.setPageIndex(0)}
            variant='outline'
          >
            <span className='sr-only'>{t('go_to_first_page')}</span>
            <ChevronsLeft />
          </Button>
          <Button
            className='h-8 w-8 p-0'
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
            variant='outline'
          >
            <span className='sr-only'>{t('go_to_previous_page')}</span>
            <ChevronLeft />
          </Button>
          <Button
            className='h-8 w-8 p-0'
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
            variant='outline'
          >
            <span className='sr-only'>{t('go_to_next_page')}</span>
            <ChevronRight />
          </Button>
          <Button
            className='hidden h-8 w-8 p-0 lg:flex'
            disabled={!table.getCanNextPage()}
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            variant='outline'
          >
            <span className='sr-only'>{t('go_to_last_page')}</span>
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
