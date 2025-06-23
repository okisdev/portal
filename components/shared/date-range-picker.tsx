'use client';

import { addMonths, format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import * as React from 'react';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
  className?: string;
  initialDateFrom?: Date;
  initialDateTo?: Date;
  onChange?: (date: DateRange | undefined) => void;
  align?: 'start' | 'center' | 'end';
}

export function DateRangePicker({
  className,
  initialDateFrom,
  initialDateTo,
  onChange,
  align = 'start',
}: DateRangePickerProps) {
  const t = useTranslations();

  const [isOpen, setIsOpen] = React.useState(false);
  const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date());
  const [selectedRange, setSelectedRange] = React.useState<DateRange>({
    from: initialDateFrom,
    to: initialDateTo,
  });

  const presets = [
    {
      label: t('today'),
      dates: { from: new Date(), to: new Date() },
    },
    {
      label: t('last_7_days'),
      dates: {
        from: (() => {
          const date = new Date();
          date.setDate(date.getDate() - 7);
          return date;
        })(),
        to: new Date(),
      },
    },
    {
      label: t('last_30_days'),
      dates: { from: addMonths(new Date(), -1), to: new Date() },
    },
    {
      label: t('last_90_days'),
      dates: { from: addMonths(new Date(), -3), to: new Date() },
    },
  ];

  const handleSelect = (range: DateRange | undefined) => {
    setSelectedRange(range || { from: undefined, to: undefined });
  };

  const moveMonth = (direction: 'forward' | 'backward') => {
    setCurrentMonth((current) => {
      return direction === 'forward'
        ? addMonths(current, 1)
        : addMonths(current, -1);
    });
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id='date'
            variant={'outline'}
            className={cn(
              'w-[300px] justify-start text-left font-normal',
              !selectedRange && 'text-muted-foreground',
              'hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <CalendarIcon className='mr-2 h-4 w-4' />
            {selectedRange?.from ? (
              selectedRange.to ? (
                <>
                  {format(selectedRange.from, 'LLL dd, y')} -{' '}
                  {format(selectedRange.to, 'LLL dd, y')}
                </>
              ) : (
                format(selectedRange.from, 'LLL dd, y')
              )
            ) : (
              <span>{t('pick_a_date_range')}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto p-0' align={align}>
          <div className='flex'>
            <div className='min-w-[150px] border-r p-3'>
              <div className='space-y-3'>
                <h4 className='font-medium text-sm'>{t('quick_select')}</h4>
                <div className='flex flex-col gap-2'>
                  {presets.map((preset) => (
                    <Button
                      key={preset.label}
                      variant='ghost'
                      className='justify-start text-left text-sm'
                      onClick={() => {
                        setSelectedRange(preset.dates);
                        onChange?.(preset.dates);
                        setIsOpen(false);
                      }}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <div className='p-3'>
              <div className='space-y-4'>
                <div className='flex items-center justify-center gap-8'>
                  <div className='space-y-2.5 text-center'>
                    <Calendar
                      mode='range'
                      defaultMonth={currentMonth}
                      selected={selectedRange}
                      onSelect={handleSelect}
                      numberOfMonths={1}
                      className='border-0'
                      classNames={{
                        months: 'space-y-4',
                        month: 'space-y-4',
                        caption:
                          'flex justify-center pt-1 relative items-center',
                        caption_label: 'text-sm font-medium',
                        nav: 'space-x-1 flex items-center',
                        nav_button:
                          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
                        nav_button_previous: 'absolute left-1',
                        nav_button_next: 'absolute right-1',
                        table: 'w-full border-collapse space-y-1',
                        head_row: 'flex',
                        head_cell:
                          'text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]',
                        row: 'flex w-full mt-2',
                        cell: cn(
                          'relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent',
                          '[&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-range-start)]:rounded-l-md',
                          'first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md'
                        ),
                        day: cn(
                          'h-8 w-8 p-0 font-normal aria-selected:opacity-100'
                        ),
                        day_range_start: 'day-range-start',
                        day_range_end: 'day-range-end',
                        day_selected:
                          'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
                        day_today: 'bg-accent text-accent-foreground',
                        day_outside: 'text-muted-foreground opacity-50',
                        day_disabled: 'text-muted-foreground opacity-50',
                        day_range_middle:
                          'aria-selected:bg-accent aria-selected:text-accent-foreground',
                        day_hidden: 'invisible',
                      }}
                    />
                  </div>
                  <div className='space-y-2.5 text-center'>
                    <Calendar
                      mode='range'
                      defaultMonth={addMonths(currentMonth, 1)}
                      selected={selectedRange}
                      onSelect={handleSelect}
                      numberOfMonths={1}
                      className='border-0'
                      classNames={{
                        months: 'space-y-4',
                        month: 'space-y-4',
                        caption:
                          'flex justify-center pt-1 relative items-center',
                        caption_label: 'text-sm font-medium',
                        nav: 'space-x-1 flex items-center',
                        nav_button:
                          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
                        nav_button_previous: 'absolute left-1',
                        nav_button_next: 'absolute right-1',
                        table: 'w-full border-collapse space-y-1',
                        head_row: 'flex',
                        head_cell:
                          'text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]',
                        row: 'flex w-full mt-2',
                        cell: cn(
                          'relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent',
                          '[&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-range-start)]:rounded-l-md',
                          'first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md'
                        ),
                        day: cn(
                          'h-8 w-8 p-0 font-normal aria-selected:opacity-100'
                        ),
                        day_range_start: 'day-range-start',
                        day_range_end: 'day-range-end',
                        day_selected:
                          'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
                        day_today: 'bg-accent text-accent-foreground',
                        day_outside: 'text-muted-foreground opacity-50',
                        day_disabled: 'text-muted-foreground opacity-50',
                        day_range_middle:
                          'aria-selected:bg-accent aria-selected:text-accent-foreground',
                        day_hidden: 'invisible',
                      }}
                    />
                  </div>
                </div>
                <div className='flex items-center justify-between border-t pt-4'>
                  <div className='font-medium text-sm'>
                    {selectedRange?.from &&
                      format(selectedRange.from, 'MMM d, yyyy')}
                    {selectedRange?.to &&
                      ` - ${format(selectedRange.to, 'MMM d, yyyy')}`}
                  </div>
                  <div className='flex space-x-2'>
                    <Button
                      variant='outline'
                      onClick={() => {
                        setSelectedRange({ from: undefined, to: undefined });
                        setIsOpen(false);
                      }}
                    >
                      {t('cancel')}
                    </Button>
                    <Button
                      onClick={() => {
                        onChange?.(selectedRange);
                        setIsOpen(false);
                      }}
                    >
                      {t('apply')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
