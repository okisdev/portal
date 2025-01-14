'use client';

import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open) {
      setSearch('');
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant='outline' aria-expanded={open} className='w-full justify-between'>
          {value || placeholder}
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-full p-0' align='start'>
        <Command>
          <CommandInput placeholder={searchPlaceholder} onValueChange={setSearch} />
          <CommandEmpty>{emptyText}</CommandEmpty>
          {allowCustom && search && (
            <CommandGroup heading='Custom'>
              <CommandItem
                value={`custom-${search}`}
                onSelect={() => {
                  onChange(search);
                  setOpen(false);
                }}
              >
                Use "{search}"
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
