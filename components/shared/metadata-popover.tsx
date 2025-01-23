import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

interface PopoverContentProps {
  title?: string;
  withTitle?: boolean;
  trigger?: ReactNode;
  children: ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end';
}

export function MetadataPopover({ title, withTitle = true, trigger, children, className = 'w-80', align = 'end' }: PopoverContentProps) {
  const t = useTranslations();

  return (
    <Popover>
      <PopoverTrigger asChild>
        {trigger || (
          <button type='button' className='rounded-md bg-muted/50 px-1 py-0.5 text-muted-foreground text-xs hover:bg-muted'>
            <Info className='mr-1 inline-block size-3' />
            {withTitle ? title : t('view_details')}
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent className={className} align={align}>
        {children}
      </PopoverContent>
    </Popover>
  );
}
