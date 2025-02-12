'use client';

import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn, generateUUID } from '@/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
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
  renderItem?: (item: string) => React.ReactNode;
  className?: string;
  size?: 'sm' | 'lg' | 'default' | 'icon' | null | undefined;
  alwaysPlaceHolder?: boolean;
}

interface ComboboxCommandProps {
  query: string;
  setQuery: (value: string) => void;
  value: string;
  onChange: (value: string) => void;
  setOpen: (value: boolean) => void;
  items: string[];
  searchPlaceholder: string;
  emptyText: string;
  groupHeading: string;
  allowCustom: boolean;
  renderItem?: (item: string) => React.ReactNode;
}

function ComboboxCommand({ query, setQuery, value, onChange, setOpen, items, searchPlaceholder, emptyText, groupHeading, allowCustom, renderItem }: ComboboxCommandProps) {
  const t = useTranslations();

  const filteredItems = items.filter((item) => item.toLowerCase().includes(query.toLowerCase()));

  return (
    <Command>
      <CommandInput placeholder={searchPlaceholder} value={query} onValueChange={setQuery} />
      <CommandEmpty>{emptyText}</CommandEmpty>
      {allowCustom && query && !filteredItems.includes(query) && (
        <CommandGroup heading={t('custom')}>
          <CommandItem
            value={`custom-${query}`}
            onSelect={() => {
              onChange(query);
              setOpen(false);
            }}
          >
            {t('use_query', { query })}
          </CommandItem>
        </CommandGroup>
      )}
      <CommandGroup heading={groupHeading} className='max-h-[300px] overflow-y-auto'>
        {filteredItems.map((item) => (
          <CommandItem
            key={item + generateUUID()}
            value={item}
            onSelect={() => {
              onChange(item);
              setOpen(false);
            }}
            className='flex cursor-pointer items-center gap-2'
          >
            {renderItem ? (
              renderItem(item)
            ) : (
              <>
                {item}
                {value === item && <Check className='ml-auto h-4 w-4' />}
              </>
            )}
          </CommandItem>
        ))}
      </CommandGroup>
    </Command>
  );
}

function Combobox({
  value,
  onChange,
  items = [],
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  emptyText = 'No results found',
  groupHeading = 'Items',
  allowCustom = true,
  renderItem,
  className,
  size = 'default',
  alwaysPlaceHolder = false,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) {
      setQuery('');
    }
  }, [open]);

  useEffect(() => {
    if (value && !items.includes(value) && !allowCustom) {
      onChange('');
    }
  }, [items, value, onChange, allowCustom]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant='outline' size={size} aria-expanded={open} className={cn('w-full justify-between px-3 font-normal', className)}>
          {alwaysPlaceHolder ? placeholder : value || placeholder}
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-(--radix-popper-anchor-width) p-0' align='end'>
        <ComboboxCommand
          query={query}
          setQuery={setQuery}
          value={value}
          onChange={onChange}
          setOpen={setOpen}
          items={items}
          searchPlaceholder={searchPlaceholder}
          emptyText={emptyText}
          groupHeading={groupHeading}
          allowCustom={allowCustom}
          renderItem={renderItem}
        />
      </PopoverContent>
    </Popover>
  );
}

export { ComboboxCommand, Combobox };
