import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { randomString } from '@/lib/utils';

interface TableLoadingProps {
  columnCount?: number;
  rowCount?: number;
  showActions?: boolean;
}

export function TableLoading({
  columnCount = 5,
  rowCount = 10,
  showActions = true,
}: TableLoadingProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {Array.from({ length: columnCount }).map((_, i) => (
            <TableHead key={randomString(10)}>
              <Skeleton className='h-4 w-24' />
            </TableHead>
          ))}
          {showActions && (
            <TableHead className='text-right'>
              <Skeleton className='ml-auto h-4 w-16' />
            </TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rowCount }).map((_, i) => (
          <TableRow key={randomString(10)}>
            {Array.from({ length: columnCount }).map((_, j) => (
              <TableCell key={randomString(10)}>
                <Skeleton className='h-6 w-full' />
              </TableCell>
            ))}
            {showActions && (
              <TableCell className='text-right'>
                <Skeleton className='ml-auto h-8 w-8' />
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
