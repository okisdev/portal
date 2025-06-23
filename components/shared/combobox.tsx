'use client';

import { Check, ChevronsUpDown } from 'lucide-react';
import { nanoid } from 'nanoid';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  items?: string[];
  recommendedItems?: string[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  groupHeading?: string;
  recommendedHeading?: string;
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
  recommendedHeading?: string;
  recommendedItems?: string[];
  allowCustom: boolean;
  renderItem?: (item: string) => React.ReactNode;
}

function ComboboxCommand({
  query,
  setQuery,
  value,
  onChange,
  setOpen,
  items,

  searchPlaceholder,
  emptyText,
  groupHeading,
  recommendedHeading,
  recommendedItems = [],
  allowCustom,
  renderItem,
}: ComboboxCommandProps) {
  const t = useTranslations();

  const filteredItems = items.filter((item) =>
    item.toLowerCase().includes(query.toLowerCase())
  );
  const filteredRecommendedItems = recommendedItems.filter((item) =>
    item.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Command>
      <CommandInput
        placeholder={searchPlaceholder}
        value={query}
        onValueChange={setQuery}
      />
      <CommandEmpty>{emptyText}</CommandEmpty>
      {allowCustom &&
        query &&
        !filteredItems.includes(query) &&
        !filteredRecommendedItems.includes(query) && (
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
      {filteredRecommendedItems.length > 0 && (
        <CommandGroup
          heading={recommendedHeading}
          className='max-h-[150px] overflow-y-auto'
        >
          {filteredRecommendedItems.map((item) => (
            <CommandItem
              key={`recommended-${item}-${nanoid()}`}
              value={item}
              onSelect={() => {
                onChange(value === item ? '' : item);
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
      )}
      <CommandGroup
        heading={groupHeading}
        className='max-h-[300px] overflow-y-auto'
      >
        {filteredItems.map((item) => (
          <CommandItem
            key={item + nanoid()}
            value={item}
            onSelect={() => {
              onChange(value === item ? '' : item);
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
  recommendedItems = [],
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  emptyText = 'No results found',
  groupHeading = 'Items',
  recommendedHeading = 'Recommended',
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
    if (
      value &&
      !items.includes(value) &&
      !recommendedItems?.includes(value) &&
      !allowCustom
    ) {
      onChange('');
    }
  }, [items, recommendedItems, value, onChange, allowCustom]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          size={size}
          aria-expanded={open}
          className={cn(
            'group w-full justify-between px-3 font-normal',
            className
          )}
        >
          <span className='flex-1 text-left'>
            {alwaysPlaceHolder ? placeholder : value || placeholder}
          </span>
          <ChevronsUpDown className='h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className='w-(--radix-popper-anchor-width) p-0'
        align='end'
      >
        <ComboboxCommand
          query={query}
          setQuery={setQuery}
          value={value}
          onChange={onChange}
          setOpen={setOpen}
          items={items}
          recommendedItems={recommendedItems}
          searchPlaceholder={searchPlaceholder}
          emptyText={emptyText}
          groupHeading={groupHeading}
          recommendedHeading={recommendedHeading}
          allowCustom={allowCustom}
          renderItem={renderItem}
        />
      </PopoverContent>
    </Popover>
  );
}

export { ComboboxCommand, Combobox };
