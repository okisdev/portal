'use client';

import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { insuranceCompanies } from '@/data/data';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CompanyComboboxProps {
  value: string;
  onChange: (value: string) => void;
}

export function CompanyCombobox({ value, onChange }: CompanyComboboxProps) {
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
          {value || 'Select company...'}
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-full p-0' align='start'>
        <Command>
          <CommandInput placeholder='Search company...' onValueChange={setSearch} />
          <CommandEmpty>No results found</CommandEmpty>
          <CommandGroup heading='Custom'>
            {search && (
              <CommandItem
                value={`custom-${search}`}
                onSelect={() => {
                  onChange(search);
                  setOpen(false);
                }}
              >
                Use "{search}"
              </CommandItem>
            )}
          </CommandGroup>
          <CommandGroup heading='Companies'>
            {insuranceCompanies.map((company) => (
              <CommandItem
                key={company}
                value={company}
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
