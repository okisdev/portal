import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { MONTHS } from './constants';

interface CalendarHeaderProps {
  currentDate: Date;
  view: 'month' | 'week' | '3days' | 'day';
  onViewChange: (view: 'month' | 'week' | '3days' | 'day') => void;
  onTodayClick: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onAddEvent: () => void;
}

export function CalendarHeader({ currentDate, view, onViewChange, onTodayClick, onPrevious, onNext, onAddEvent }: CalendarHeaderProps) {
  const t = useTranslations();

  const getHeaderText = () => {
    if (view === 'month') {
      return `${currentDate.getFullYear()} ${MONTHS[currentDate.getMonth()]}`;
    }
    if (view === 'week') {
      const endDate = new Date(currentDate.getTime() + 6 * 24 * 60 * 60 * 1000);
      return `${MONTHS[currentDate.getMonth()]} ${currentDate.getDate()} - ${MONTHS[endDate.getMonth()]} ${endDate.getDate()}, ${currentDate.getFullYear()}`;
    }
    if (view === '3days') {
      const endDate = new Date(currentDate.getTime() + 2 * 24 * 60 * 60 * 1000);
      return `${MONTHS[currentDate.getMonth()]} ${currentDate.getDate()} - ${MONTHS[endDate.getMonth()]} ${endDate.getDate()}, ${currentDate.getFullYear()}`;
    }
    return `${MONTHS[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
  };

  return (
    <header className='flex items-center justify-between border-b px-4 py-2'>
      <div className='flex items-center gap-4'>
        <Button variant='outline' onClick={onTodayClick} className='h-8'>
          {t('today')}
        </Button>
        <div className='flex items-center gap-2'>
          <Button variant='ghost' size='icon' onClick={onPrevious}>
            <ChevronLeft className='h-4 w-4' />
          </Button>
          <Button variant='ghost' size='icon' onClick={onNext}>
            <ChevronRight className='h-4 w-4' />
          </Button>
        </div>
        <h1 className='text-sm md:text-base'>{getHeaderText()}</h1>
      </div>
      <div className='flex items-center gap-2'>
        <div className='flex rounded-md border'>
          <Button variant={view === 'month' ? 'secondary' : 'ghost'} className='h-8 rounded-r-none' onClick={() => onViewChange('month')}>
            {t('month')}
          </Button>
          <Button variant={view === 'week' ? 'secondary' : 'ghost'} className='h-8 rounded-none border-r border-l' onClick={() => onViewChange('week')}>
            {t('week')}
          </Button>
          <Button variant={view === '3days' ? 'secondary' : 'ghost'} className='h-8 rounded-none border-r' onClick={() => onViewChange('3days')}>
            {t('3days')}
          </Button>
          <Button variant={view === 'day' ? 'secondary' : 'ghost'} className='h-8 rounded-l-none' onClick={() => onViewChange('day')}>
            {t('day')}
          </Button>
        </div>
        <Button variant='outline' className='h-8 w-auto' onClick={onAddEvent}>
          <Plus className='h-4 w-4' />
          {t('add_event')}
        </Button>
      </div>
    </header>
  );
}
