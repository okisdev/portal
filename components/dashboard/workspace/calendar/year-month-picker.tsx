import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Locale } from '@/types/i18n';
import { MONTHS } from './constants';

export interface YearMonthPickerProps {
  value: Date;
  onChange: (date: Date) => void;
  onClose: () => void;
}

export function YearMonthPicker({
  value,
  onChange,
  onClose,
}: YearMonthPickerProps) {
  const [mode, setMode] = useState<'month' | 'year'>('month');
  const [displayYear, setDisplayYear] = useState(value.getFullYear());
  const locale = useLocale() as Locale;
  const t = useTranslations();

  const handlePrevious = () => {
    if (mode === 'month') {
      setDisplayYear(displayYear - 1);
    } else {
      setDisplayYear(displayYear - 12);
    }
  };

  const handleNext = () => {
    if (mode === 'month') {
      setDisplayYear(displayYear + 1);
    } else {
      setDisplayYear(displayYear + 12);
    }
  };

  const handleYearClick = (year: number) => {
    setDisplayYear(year);
    setMode('month');
  };

  const handleMonthClick = (month: number) => {
    const newDate = new Date(value);
    newDate.setFullYear(displayYear);
    newDate.setMonth(month);
    onChange(newDate);
    onClose();
  };

  return (
    <div className='p-2'>
      <div className='mb-2 flex items-center justify-between'>
        <Button
          className='font-medium text-sm'
          onClick={() => setMode(mode === 'month' ? 'year' : 'month')}
          variant='ghost'
        >
          {mode === 'month'
            ? displayYear
            : `${displayYear - 6} - ${displayYear + 5}`}
        </Button>
        <div className='flex items-center gap-1'>
          <Button
            className='h-7 w-7'
            onClick={handlePrevious}
            size='icon'
            variant='ghost'
          >
            <ChevronLeft className='h-4 w-4' />
          </Button>
          <Button
            className='h-7 w-7'
            onClick={handleNext}
            size='icon'
            variant='ghost'
          >
            <ChevronRight className='h-4 w-4' />
          </Button>
        </div>
      </div>

      {mode === 'month' ? (
        <div className='grid grid-cols-3 gap-2'>
          {MONTHS.map((month, index) => (
            <Button
              className={cn(
                'h-9',
                value.getMonth() === index &&
                  value.getFullYear() === displayYear &&
                  'bg-primary text-primary-foreground'
              )}
              key={month}
              onClick={() => handleMonthClick(index)}
              variant='ghost'
            >
              {locale === 'en' ? month.slice(0, 3) : t(month.toLowerCase())}
            </Button>
          ))}
        </div>
      ) : (
        <div className='grid grid-cols-3 gap-2'>
          {Array.from({ length: 12 }, (_, i) => displayYear - 6 + i).map(
            (year) => (
              <Button
                className={cn(
                  'h-9',
                  value.getFullYear() === year &&
                    'bg-primary text-primary-foreground'
                )}
                key={year}
                onClick={() => handleYearClick(year)}
                variant='ghost'
              >
                {year}
              </Button>
            )
          )}
        </div>
      )}
    </div>
  );
}
