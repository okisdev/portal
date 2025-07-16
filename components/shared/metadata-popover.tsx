import { Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface PopoverContentProps {
  title?: string;
  withTitle?: boolean;
  trigger?: ReactNode;
  children: ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end';
}

export function MetadataPopover({
  title,
  withTitle = true,
  trigger,
  children,
  className = 'w-80',
  align = 'end',
}: PopoverContentProps) {
  const t = useTranslations();

  return (
    <Popover>
      <PopoverTrigger asChild>
        {trigger || (
          <button
            className='flex cursor-pointer items-center rounded bg-muted/50 px-1 py-0.5 text-muted-foreground text-xs transition-colors hover:bg-foreground/10 hover:text-foreground'
            type='button'
          >
            <Info className='mr-1 inline-block size-3' />
            <span>{withTitle ? title : t('view_details')}</span>
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className={cn('h-auto max-h-[50vh] overflow-y-auto', className)}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}
