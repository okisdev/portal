import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import * as React from 'react';

const MONTHS_ZH = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

interface YearMonthPickerProps {
  value: Date;
  onChange: (date: Date) => void;
  onClose: () => void;
}

export function YearMonthPicker({ value, onChange, onClose }: YearMonthPickerProps) {
  const [year, setYear] = React.useState(value.getFullYear());

  const updateYear = (newYear: number) => {
    setYear(newYear);
  };

  const selectMonth = (monthIndex: number) => {
    onChange(new Date(year, monthIndex, 1));
    onClose();
  };

  return (
    <div className='p-2'>
      <div className='flex justify-between items-center mb-4'>
        <Button variant='outline' size='sm' onClick={() => updateYear(year - 1)}>
          <ChevronLeft className='h-4 w-4' />
        </Button>
        <span className='text-lg font-semibold'>{year}年</span>
        <Button variant='outline' size='sm' onClick={() => updateYear(year + 1)}>
          <ChevronRight className='h-4 w-4' />
        </Button>
      </div>
      <div className='grid grid-cols-3 gap-2'>
        {MONTHS_ZH.map((monthName, index) => (
          <Button key={monthName} variant='outline' className='w-full' onClick={() => selectMonth(index)}>
            {monthName}
          </Button>
        ))}
      </div>
    </div>
  );
}
