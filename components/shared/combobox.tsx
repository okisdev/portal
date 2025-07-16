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
        onValueChange={setQuery}
        placeholder={searchPlaceholder}
        value={query}
      />
      <CommandEmpty>{emptyText}</CommandEmpty>
      {allowCustom &&
        query &&
        !filteredItems.includes(query) &&
        !filteredRecommendedItems.includes(query) && (
          <CommandGroup heading={t('custom')}>
            <CommandItem
              onSelect={() => {
                onChange(query);
                setOpen(false);
              }}
              value={`custom-${query}`}
            >
              {t('use_query', { query })}
            </CommandItem>
          </CommandGroup>
        )}
      {filteredRecommendedItems.length > 0 && (
        <CommandGroup
          className='max-h-[150px] overflow-y-auto'
          heading={recommendedHeading}
        >
          {filteredRecommendedItems.map((item) => (
            <CommandItem
              className='flex cursor-pointer items-center gap-2'
              key={`recommended-${item}-${nanoid()}`}
              onSelect={() => {
                onChange(value === item ? '' : item);
                setOpen(false);
              }}
              value={item}
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
        className='max-h-[300px] overflow-y-auto'
        heading={groupHeading}
      >
        {filteredItems.map((item) => (
          <CommandItem
            className='flex cursor-pointer items-center gap-2'
            key={item + nanoid()}
            onSelect={() => {
              onChange(value === item ? '' : item);
              setOpen(false);
            }}
            value={item}
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
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          className={cn(
            'group w-full justify-between px-3 font-normal',
            className
          )}
          size={size}
          variant='outline'
        >
          <span className='flex-1 text-left'>
            {alwaysPlaceHolder ? placeholder : value || placeholder}
          </span>
          <ChevronsUpDown className='h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align='end'
        className='w-(--radix-popper-anchor-width) p-0'
      >
        <ComboboxCommand
          allowCustom={allowCustom}
          emptyText={emptyText}
          groupHeading={groupHeading}
          items={items}
          onChange={onChange}
          query={query}
          recommendedHeading={recommendedHeading}
          recommendedItems={recommendedItems}
          renderItem={renderItem}
          searchPlaceholder={searchPlaceholder}
          setOpen={setOpen}
          setQuery={setQuery}
          value={value}
        />
      </PopoverContent>
    </Popover>
  );
}

export { ComboboxCommand, Combobox };
