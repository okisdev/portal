import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  right?: React.ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  description,
  right,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex justify-between',
        !description && right ? 'items-center' : 'items-start'
      )}
    >
      <div className='space-y-1'>
        <p className='font-medium text-xl'>
          {title}{' '}
          <span className='text-muted-foreground text-sm'>{subtitle}</span>
        </p>
        {description && <p className='text-muted-foreground'>{description}</p>}
      </div>
      {right}
    </div>
  );
}
