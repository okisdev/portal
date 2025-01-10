import Link from 'next/link';

export default function NotFound() {
  return (
    <div className='flex h-full flex-1 flex-col items-center justify-center gap-4 p-8'>
      <div className='space-y-2 text-center'>
        <h1 className='font-medium text-xl'>404 - Not Found</h1>
        <p className='text-muted-foreground'>The page you are looking for does not exist.</p>
      </div>
      <Link href='/' className='text-muted-foreground text-sm transition duration-300 hover:text-primary'>
        Go back to home
      </Link>
    </div>
  );
}
