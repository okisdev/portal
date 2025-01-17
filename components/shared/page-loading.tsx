import { Skeleton } from '@/components/ui/skeleton';

export function PageLoading() {
  return (
    <div className='space-y-4 p-4'>
      <Skeleton className='h-8 w-1/2' />
      <Skeleton className='h-8 w-1/2' />
      <Skeleton className='h-8 w-full' />
      <Skeleton className='h-8 w-full' />
    </div>
  );
}
