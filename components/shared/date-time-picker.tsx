'use client';

import { CalendarIcon } from '@radix-ui/react-icons';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export function DateTimePicker({
  value,
  onChange,
  showTimePicker = true,
  size = 'default',
  onClose,
}: {
  value: Date | null;
  onChange: (date: Date | null) => void;
  showTimePicker?: boolean;
  size?: 'sm' | 'default' | 'icon' | 'lg' | null | undefined;
  onClose?: () => void;
}) {
  const t = useTranslations();

  function handleDateSelect(date: Date | undefined) {
    if (date) {
      const newDate = new Date(date);
      if (showTimePicker) {
        // If we had a previous value, use its time, otherwise use current time
        const prevDate = value || new Date();
        newDate.setHours(prevDate.getHours());
        newDate.setMinutes(prevDate.getMinutes());
      } else {
        // For all-day events, set time to start of day
        newDate.setHours(0);
        newDate.setMinutes(0);
        newDate.setSeconds(0);
        newDate.setMilliseconds(0);
      }
      onChange(newDate);
    }
  }

  function handleTimeChange(type: 'hour' | 'minute', timeValue: string) {
    const newDate = new Date(value || new Date());

    if (type === 'hour') {
      const hour = Number.parseInt(timeValue, 10);
      newDate.setHours(hour);
    } else if (type === 'minute') {
      const minute = Number.parseInt(timeValue, 10);
      newDate.setMinutes(minute);
    }

    onChange(newDate);
  }

  return (
    <Popover onOpenChange={(open) => !open && onClose?.()}>
      <PopoverTrigger asChild>
        <div>
          <Button
            className={cn(
              'flex w-full items-center pl-3 text-left font-normal',
              !value && 'text-muted-foreground'
            )}
            size={size}
            type='button'
            variant={'outline'}
          >
            <span className='truncate'>
              {value ? (
                showTimePicker ? (
                  format(value, 'MM/dd/yyyy HH:mm')
                ) : (
                  format(value, 'MM/dd/yyyy')
                )
              ) : (
                <span>{t('select_date')}</span>
              )}
            </span>
            <CalendarIcon className='ml-auto h-4 w-4 shrink-0 opacity-50' />
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0'>
        <div className='sm:flex'>
          <Calendar
            initialFocus
            mode='single'
            onSelect={handleDateSelect}
            selected={value === null ? undefined : value}
          />
          {showTimePicker && value && (
            <div className='flex flex-col divide-y sm:h-[300px] sm:flex-row sm:divide-x sm:divide-y-0'>
              <div className='overflow-y-auto'>
                <div className='flex p-2 sm:flex-col'>
                  {Array.from({ length: 24 }, (_, i) => i)
                    .reverse()
                    .map((hour) => (
                      <Button
                        className='aspect-square shrink-0 sm:w-full'
                        key={hour}
                        onClick={() =>
                          handleTimeChange('hour', hour.toString())
                        }
                        size='icon'
                        type='button'
                        variant={
                          value.getHours() === hour ? 'default' : 'ghost'
                        }
                      >
                        {hour}
                      </Button>
                    ))}
                </div>
              </div>
              <div className='overflow-y-auto'>
                <div className='flex p-2 sm:flex-col'>
                  {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                    <Button
                      className='aspect-square shrink-0 sm:w-full'
                      key={minute}
                      onClick={() =>
                        handleTimeChange('minute', minute.toString())
                      }
                      size='icon'
                      type='button'
                      variant={
                        value.getMinutes() === minute ? 'default' : 'ghost'
                      }
                    >
                      {minute.toString().padStart(2, '0')}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
