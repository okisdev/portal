import {
  addDays,
  endOfMonth,
  format,
  getDate,
  isSameDay,
  isSameMonth,
  startOfMonth,
  subDays,
} from 'date-fns';
import { enUS, zhCN, zhHK } from 'date-fns/locale';
import {
  ChevronsUpDown,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { ActionAlertDialog } from '@/components/shared/action-alert-dialog';
import { NameTag } from '@/components/shared/name-tag';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import type { CalendarFolder } from '@/lib/schema';
import { cn } from '@/lib/utils';
import type { Locale } from '@/types/i18n';
import { WEEKDAYS } from './constants';
import { YearMonthPicker } from './year-month-picker';

interface CalendarSidePanelProps {
  currentDate: Date;
  selectedDate: Date;
  isLoading: boolean;
  onDateSelect: (date: Date) => void;
  folders: CalendarFolder[];
  hiddenCalendars: Set<string>;
  onToggleCalendar: (folderId: string) => void;
  onAddCalendar: () => void;
  onEditCalendar: (folder: CalendarFolder) => void;
  onDeleteCalendar: (folderId: string) => void;
}

export function CalendarSidePanel({
  currentDate,
  selectedDate,
  isLoading,
  onDateSelect,
  folders,
  hiddenCalendars,
  onToggleCalendar,
  onAddCalendar,
  onEditCalendar,
  onDeleteCalendar,
}: CalendarSidePanelProps) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const { data: session } = useSession();

  const dateLocale =
    {
      en: enUS,
      'zh-HK': zhHK,
      'zh-CN': zhCN,
    }[locale] || enUS;

  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);

  const getDaysInMonth = (date: Date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const days = [];

    // Get days from previous month
    const firstDayOfWeek = start.getDay();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push(subDays(start, i + 1));
    }

    // Get days of current month
    let currentDate = start;
    while (currentDate <= end) {
      days.push(currentDate);
      currentDate = addDays(currentDate, 1);
    }

    // Get days from next month
    const remainingDays = 42 - days.length;
    currentDate = addDays(end, 1);
    for (let i = 0; i < remainingDays; i++) {
      days.push(currentDate);
      currentDate = addDays(currentDate, 1);
    }

    return days;
  };

  return (
    <div className='flex w-64 flex-col gap-4 p-4'>
      <div className='flex items-center justify-between'>
        <Popover>
          <PopoverTrigger asChild>
            <Button className='w-full justify-between' variant='outline'>
              <span>
                {format(currentDate, 'MMMM yyyy', { locale: dateLocale })}
              </span>
              <ChevronsUpDown className='h-4 w-4' />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align='start'
            className='w-(--radix-popper-anchor-width) p-0'
          >
            <YearMonthPicker
              onChange={(date) => {
                onDateSelect(date);
                const newDate = new Date(date);
                newDate.setDate(1);
                onDateSelect(newDate);
              }}
              onClose={() => {}}
              value={currentDate}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className='grid grid-cols-7 gap-1 text-sm'>
        {WEEKDAYS.map((day) => (
          <div className='text-center text-muted-foreground' key={day}>
            {locale === 'en' ? t(day).slice(0, 1) : t(day).slice(2)}
          </div>
        ))}
        {getDaysInMonth(currentDate)
          .slice(0, 35)
          .map((date) => (
            <Button
              className={cn(
                'h-6 w-6 p-0',
                !isSameMonth(date, currentDate) && 'text-muted-foreground',
                isSameDay(date, selectedDate) &&
                  'bg-primary text-primary-foreground'
              )}
              key={date.toISOString()}
              onClick={() => onDateSelect(date)}
              variant='ghost'
            >
              {getDate(date)}
            </Button>
          ))}
      </div>

      <div className='flex flex-col gap-2'>
        <div className='flex items-center justify-between gap-2'>
          <p className='flex-1 text-sm'>{t('calendars')}</p>
          <Button
            className='h-6 w-6'
            onClick={onAddCalendar}
            size='icon'
            variant='ghost'
          >
            <Plus className='h-4 w-4' />
          </Button>
        </div>
        <div className='flex w-full flex-col gap-2'>
          <div className='flex flex-col space-y-1'>
            {isLoading && (
              <>
                <Skeleton className='h-8 w-full' />
                <Skeleton className='h-8 w-full' />
                <Skeleton className='h-8 w-full' />
                <Skeleton className='h-8 w-full' />
              </>
            )}
            {folders?.length === 0 && !isLoading && (
              <div className='text-muted-foreground text-sm'>
                {t('no_calendars_found')}
              </div>
            )}
            {folders?.map((folder) => (
              <div className='flex items-center gap-2' key={folder.id}>
                <Checkbox
                  checked={!hiddenCalendars.has(folder.id)}
                  onCheckedChange={(checked) => onToggleCalendar(folder.id)}
                />
                <Button
                  className='h-8 min-w-0 flex-1 justify-start px-2'
                  onClick={() => onToggleCalendar(folder.id)}
                  variant='ghost'
                >
                  <div className='flex min-w-0 flex-1 items-center'>
                    <div
                      className='mr-1 h-4 w-4 shrink-0 rounded-full'
                      style={{ backgroundColor: folder.color ?? 'transparent' }}
                    />
                    <span className='truncate'>{folder.name}</span>
                  </div>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      className='h-8 w-8 p-0'
                      onClick={(e) => e.stopPropagation()}
                      variant='ghost'
                    >
                      <MoreHorizontal className='h-4 w-4' />
                      <span className='sr-only'>{t('open_menu')}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='w-72'>
                    <DropdownMenuItem className='flex cursor-default flex-col items-start gap-1 p-3'>
                      <div className='flex w-full items-center gap-2'>
                        <div
                          className='h-3 w-3 rounded-full'
                          style={{
                            backgroundColor: folder.color ?? 'transparent',
                          }}
                        />
                        <span className='flex-1 font-medium'>
                          {folder.name}
                        </span>
                        <div className='rounded-full bg-secondary px-2 py-0.5 text-xs'>
                          {folder.userId === session?.user?.id
                            ? t('owner')
                            : t('shared')}
                        </div>
                      </div>
                      <div className='mt-2 w-full space-y-2 text-muted-foreground text-xs'>
                        <div className='flex justify-between'>
                          <span>{t('visibility')}:</span>
                          <span className='font-medium'>
                            {t(folder.visibility)}
                          </span>
                        </div>
                        <div className='flex justify-between'>
                          <span>{t('created_by')}:</span>
                          <span className='font-medium'>
                            {folder.userId === session?.user?.id ? (
                              t('you')
                            ) : (
                              <NameTag id={folder.userId} type='user' />
                            )}
                          </span>
                        </div>
                        <div className='flex justify-between'>
                          <span>{t('created')}:</span>
                          <span className='font-medium'>
                            {format(new Date(folder.createdAt), 'PP', {
                              locale: dateLocale,
                            })}
                          </span>
                        </div>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className='cursor-pointer'
                      onClick={() => onToggleCalendar(folder.id)}
                    >
                      <Eye className='mr-2 h-4 w-4' />
                      {hiddenCalendars.has(folder.id) ? t('show') : t('hide')}
                    </DropdownMenuItem>
                    {folder.userId === session?.user?.id ? (
                      <>
                        <DropdownMenuItem
                          className='cursor-pointer'
                          onClick={() => onEditCalendar(folder)}
                        >
                          <Pencil className='mr-2 h-4 w-4' />
                          {t('edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className='cursor-pointer text-destructive'
                          onClick={() => setFolderToDelete(folder.id)}
                        >
                          <Trash className='mr-2 h-4 w-4' />
                          {t('delete')}
                        </DropdownMenuItem>
                      </>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ActionAlertDialog
        cancelText={t('cancel')}
        confirmText={t('delete')}
        description={t('delete_calendar_description')}
        onConfirm={() => {
          if (folderToDelete) {
            onDeleteCalendar(folderToDelete);
            setFolderToDelete(null);
          }
        }}
        onOpenChange={(open) => !open && setFolderToDelete(null)}
        open={!!folderToDelete}
        title={t('delete_calendar')}
      />
    </div>
  );
}
