'use client';

import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { insuranceCompanies } from '@/data/data';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';

interface CompanyComboboxProps {
  value: string;
  onChange: (value: string) => void;
}

export function CompanyCombobox({ value, onChange }: CompanyComboboxProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant='outline' aria-expanded={open} className='w-full justify-between'>
          {value || 'Select company...'}
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-full p-0' align='start'>
        <Command shouldFilter={false}>
          <CommandInput placeholder='Search company...' />
          <CommandEmpty>No company found</CommandEmpty>
          <CommandGroup heading='Companies'>
            {insuranceCompanies.map((company) => (
              <CommandItem
                key={company}
                onSelect={() => {
                  onChange(company);
                  setOpen(false);
                }}
              >
                {company}
                {value === company && <Check className='ml-auto h-4 w-4' />}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
