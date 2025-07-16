import { addDays, format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import type { Locale } from '@/types/i18n';
import { dateLocaleMap } from '@/utils/date';

interface CalendarHeaderProps {
  currentDate: Date;
  view: 'month' | 'week' | '3days' | 'day';
  onViewChange: (view: 'month' | 'week' | '3days' | 'day') => void;
  onTodayClick: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onAddEvent: () => void;
}

export function CalendarHeader({
  currentDate,
  view,
  onViewChange,
  onTodayClick,
  onPrevious,
  onNext,
  onAddEvent,
}: CalendarHeaderProps) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const dateLocale = dateLocaleMap[locale] || enUS;

  const getHeaderText = () => {
    if (view === 'month') {
      return format(currentDate, 'yyyy MMMM', { locale: dateLocale });
    }
    if (view === 'week') {
      const startDate = new Date(currentDate);
      const day = startDate.getDay();
      startDate.setDate(startDate.getDate() - day);
      const endDate = addDays(startDate, 6);
      const startYear = format(startDate, 'yyyy', { locale: dateLocale });
      const endYear = format(endDate, 'yyyy', { locale: dateLocale });
      const dateRange = `${format(startDate, 'MMMM d', { locale: dateLocale })} - ${format(endDate, startDate.getMonth() !== endDate.getMonth() ? 'MMMM d' : 'd', { locale: dateLocale })}`;
      return startYear === endYear
        ? `${dateRange}, ${startYear}`
        : `${dateRange}, ${startYear}-${endYear}`;
    }
    if (view === '3days') {
      const startDate = new Date(currentDate);
      const endDate = addDays(startDate, 2);
      return `${format(startDate, 'MMMM d', { locale: dateLocale })} - ${format(endDate, startDate.getMonth() !== endDate.getMonth() ? 'MMMM d' : 'd', { locale: dateLocale })}, ${format(
        startDate,
        'yyyy',
        { locale: dateLocale }
      )}`;
    }
    return format(currentDate, 'MMMM d, yyyy', { locale: dateLocale });
  };

  return (
    <header className='flex flex-col gap-2 border-b px-4 py-2 md:flex-row md:items-center md:justify-between'>
      <div className='flex items-center gap-4'>
        <Button className='h-8' onClick={onTodayClick} variant='outline'>
          {t('today')}
        </Button>
        <div className='flex items-center gap-2'>
          <Button onClick={onPrevious} size='icon' variant='ghost'>
            <ChevronLeft className='h-4 w-4' />
          </Button>
          <Button onClick={onNext} size='icon' variant='ghost'>
            <ChevronRight className='h-4 w-4' />
          </Button>
        </div>
        <h1 className='text-sm md:text-base'>{getHeaderText()}</h1>
      </div>
      <div className='flex items-center gap-2'>
        <div className='flex rounded-md border'>
          <Button
            className='h-8 rounded-r-none border-r px-2 md:px-3'
            onClick={() => onViewChange('month')}
            variant={view === 'month' ? 'secondary' : 'ghost'}
          >
            <span className='hidden md:inline'>{t('month')}</span>
            <span className='md:hidden'>M</span>
          </Button>
          <Button
            className='hidden h-8 rounded-none border-r-none border-l-none px-2 md:flex md:px-3'
            onClick={() => onViewChange('week')}
            variant={view === 'week' ? 'secondary' : 'ghost'}
          >
            <span className='hidden md:inline'>{t('week')}</span>
            <span className='md:hidden'>W</span>
          </Button>
          <Button
            className='h-8 rounded-none border-r px-2 md:border-l md:px-3'
            onClick={() => onViewChange('3days')}
            variant={view === '3days' ? 'secondary' : 'ghost'}
          >
            <span className='hidden md:inline'>{t('3days')}</span>
            <span className='md:hidden'>3D</span>
          </Button>
          <Button
            className='h-8 rounded-l-none px-2 md:px-3'
            onClick={() => onViewChange('day')}
            variant={view === 'day' ? 'secondary' : 'ghost'}
          >
            <span className='hidden md:inline'>{t('day')}</span>
            <span className='md:hidden'>D</span>
          </Button>
        </div>
        <Button
          className='h-8 w-8 p-0 md:w-auto md:px-3'
          onClick={onAddEvent}
          variant='outline'
        >
          <Plus className='h-4 w-4' />
          <span className='hidden md:ml-2 md:inline'>{t('add_event')}</span>
        </Button>
      </div>
    </header>
  );
}
