import type { CalendarEventWithParticipants } from '@/lib/schema';
import { cn } from '@/lib/utils';
import { WEEKDAYS } from './constants';
import { TimeColumn } from './time-column';
import { TimeGrid } from './time-grid';

interface DayViewProps {
  currentDate: Date;
  selectedDate: Date;
  events: CalendarEventWithParticipants[];
  onTimeSelect: (date: Date, hour: number, minute: number, isStart: boolean, e?: React.MouseEvent) => void;
  isSelecting: boolean;
  isTimeSlotSelected: (date: Date, hour: number, minute: number) => boolean;
  onSelectionEnd: () => void;
}

export function DayView({ currentDate, selectedDate, events, onTimeSelect, isSelecting, isTimeSlotSelected, onSelectionEnd }: DayViewProps) {
  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      <div className='grid grid-cols-[100px_1fr] divide-x border-b bg-background'>
        <div className='p-2 text-muted-foreground text-sm'>Time</div>
        <div
          className={cn(
            'p-2 text-sm',
            currentDate.getDate() === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear() && 'bg-accent',
            currentDate.getDate() === selectedDate.getDate() && currentDate.getMonth() === selectedDate.getMonth() && currentDate.getFullYear() === selectedDate.getFullYear() && 'bg-primary/10'
          )}
        >
          <div className='font-medium'>{WEEKDAYS[currentDate.getDay()]}</div>
          <div className='text-muted-foreground'>{currentDate.getDate()}</div>
        </div>
      </div>
      <div className='flex-1 overflow-y-auto'>
        <div className='-mr-[1px] grid grid-cols-[100px_1fr] divide-x' style={{ height: 'calc(60px * 24)' }}>
          <TimeColumn />
          <TimeGrid date={currentDate} events={events} onTimeSelect={onTimeSelect} isSelecting={isSelecting} isTimeSlotSelected={isTimeSlotSelected} onSelectionEnd={onSelectionEnd} />
        </div>
      </div>
    </div>
  );
}
