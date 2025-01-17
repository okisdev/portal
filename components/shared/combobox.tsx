'use client';

import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  items?: string[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  groupHeading?: string;
  allowCustom?: boolean;
  className?: string;
}

export function Combobox({
  value,
  onChange,
  items = [],
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  emptyText = 'No results found',
  groupHeading = 'Items',
  allowCustom = true,
  className,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) {
      setQuery('');
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant='outline' aria-expanded={open} className={cn('w-full justify-between px-3 font-normal', className)}>
          {value || placeholder}
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[--radix-popper-anchor-width] p-0' align='start'>
        <Command className='max-h-[300px] overflow-y-auto'>
          <CommandInput placeholder={searchPlaceholder} onValueChange={setQuery} />
          <CommandEmpty>{emptyText}</CommandEmpty>
          {allowCustom && query && (
            <CommandGroup heading='Custom' className=''>
              <CommandItem
                value={`custom-${query}`}
                onSelect={() => {
                  onChange(query);
                  setOpen(false);
                }}
              >
                Use "{query}"
              </CommandItem>
            </CommandGroup>
          )}
          <CommandGroup heading={groupHeading}>
            {items.map((item) => (
              <CommandItem
                key={item}
                value={item}
                onSelect={() => {
                  onChange(item);
                  setOpen(false);
                }}
                className='cursor-pointer'
              >
                {item}
                {value === item && <Check className='ml-auto h-4 w-4' />}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
