'use client';

import { AddContact } from '@/components/dashboard/contact/add-contact';
import { PageHeader } from '@/components/shared/page-header';
import { SmartColorBadge } from '@/components/shared/smart-color-badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/use-debounce';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Contact, Priority, Source, Status } from '@/lib/schema';
import { parsePhoneWithoutCountryCode } from '@/utils/phone';
import { api } from '@/utils/trpc/client';
import { DndContext, type DragEndEvent, DragOverlay, type DragStartEvent, MouseSensor, TouchSensor, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useVirtualizer } from '@tanstack/react-virtual';
import { format } from 'date-fns';
import { Calendar, CalendarClock, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface KanbanColumn {
  id: string;
  title: string;
  items: Contact[];
}

interface SortOption {
  value: string;
  label: string;
}

interface SortableItemProps {
  contact: Contact;
  onClick: (id: string) => void;
  groupBy: 'status' | 'priority' | 'source';
}

// Memoize SortableItem to prevent unnecessary re-renders
const SortableItem = memo(function SortableItem({ contact, onClick, groupBy }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: contact.id });
  const t = useTranslations();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const { data: statuses } = api.site.getStatus.useQuery();
  const { data: priorities } = api.site.getPriority.useQuery();
  const { data: sources } = api.site.getSource.useQuery();

  const handleClick = useCallback(() => onClick(contact.id), [onClick, contact.id]);

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return null;
    return format(new Date(date), 'MMM d, yyyy');
  };

  const lastContacted = formatDate(contact.lastContactedAt);
  const nextFollowUp = formatDate(contact.nextFollowUpAt);
  const createdAt = formatDate(contact.createdAt);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className='group relative cursor-pointer rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-accent'
    >
      <div className='flex items-start gap-3'>
        <Avatar className='size-8'>
          <AvatarFallback>{contact.firstName?.[0] ?? contact.name?.[0] ?? contact.email?.[0] ?? ''}</AvatarFallback>
        </Avatar>
        <div className='flex-1 space-y-1 overflow-hidden truncate'>
          <div className='flex items-center justify-between'>
            <h4 className='font-medium text-sm'>{contact.name}</h4>
          </div>
          <p className='text-muted-foreground text-xs'>{contact.email}</p>
          <div className='flex items-center gap-2'>
            {contact.phone && <span className='text-muted-foreground text-xs'>{parsePhoneWithoutCountryCode(contact.phone)}</span>}
            {contact.company && <span className='text-muted-foreground text-xs'>{contact.company}</span>}
          </div>

          <div className='flex flex-wrap gap-2 pt-1'>
            {contact.status && groupBy !== 'status' && <SmartColorBadge value={contact.status} color={statuses?.find((s: Status) => s.value === contact.status)?.color || '#6b7280'} />}
            {contact.priority && groupBy !== 'priority' && <SmartColorBadge value={contact.priority} color={priorities?.find((p: Priority) => p.value === contact.priority)?.color || '#6b7280'} />}
            {contact.source && groupBy !== 'source' && <SmartColorBadge value={contact.source} color={sources?.find((s: Source) => s.value === contact.source)?.color || '#6b7280'} />}
          </div>

          <div className='flex flex-col gap-1 pt-1'>
            {createdAt && (
              <div className='flex items-center gap-1'>
                <Calendar className='h-3 w-3 text-muted-foreground' />
                <span className='text-muted-foreground text-xs'>{t('created_at_date', { date: createdAt })}</span>
              </div>
            )}
            {lastContacted && (
              <div className='flex items-center gap-1'>
                <Clock className='h-3 w-3 text-muted-foreground' />
                <span className='text-muted-foreground text-xs'>{t('last_contacted_date', { date: lastContacted })}</span>
              </div>
            )}
            {nextFollowUp && (
              <div className='flex items-center gap-1'>
                <CalendarClock className='h-3 w-3 text-muted-foreground' />
                <span className='text-muted-foreground text-xs'>{t('next_follow_up_date', { date: nextFollowUp })}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

interface SortableColumnProps {
  column: KanbanColumn;
  contacts: Contact[];
  onClick: (id: string) => void;
  showEmptyColumns: boolean;
  groupBy: 'status' | 'priority' | 'source';
}

function DroppableColumn({ column, contacts, onClick, showEmptyColumns, groupBy }: SortableColumnProps) {
  const isMobile = useIsMobile();
  const t = useTranslations();

  const { setNodeRef, isOver } = useDroppable({ id: column.id, data: { type: 'column', column } });

  const { data: statuses } = api.site.getStatus.useQuery();
  const { data: priorities } = api.site.getPriority.useQuery();
  const { data: sources } = api.site.getSource.useQuery();

  // Container ref for virtualization
  const [columnRef, setColumnRef] = useState<HTMLDivElement | null>(null);

  // Combine refs
  const setMultipleRefs = useCallback(
    (node: HTMLDivElement | null) => {
      setColumnRef(node);
      if (setNodeRef) {
        setNodeRef(node);
      }
    },
    [setNodeRef]
  );

  // Create virtualizer for this column
  const virtualizer = useVirtualizer({
    count: column.items.length,
    getScrollElement: () => columnRef,
    estimateSize: () => 120, // Estimate card height
    overscan: 5,
    gap: 8, // Add gap between items (equivalent to space-y-2)
  });

  // Create virtual items for rendering
  const virtualItems = virtualizer.getVirtualItems();

  if (column.items.length === 0 && !showEmptyColumns) {
    return null;
  }

  const getColumnColor = () => {
    if (groupBy === 'status') {
      return statuses?.find((s: Status) => s.value === column.title)?.color || '#6b7280';
    }
    if (groupBy === 'priority') {
      return priorities?.find((p: Priority) => p.value === column.title)?.color || '#6b7280';
    }
    if (groupBy === 'source') {
      return sources?.find((s: Source) => s.value === column.title)?.color || '#6b7280';
    }
    return '#6b7280';
  };

  return (
    <div className='flex h-full w-[280px] shrink-0 flex-col sm:w-[280px]'>
      <div className='mb-2 flex items-center justify-between'>
        <SmartColorBadge value={column.title} color={getColumnColor()} />
        <span className='text-muted-foreground text-xs'>{column.items.length}</span>
      </div>
      <div ref={setMultipleRefs} className={`flex-1 overflow-y-auto rounded-lg border p-2 ${isOver ? 'bg-accent/20' : 'bg-muted/50'}`} style={{ position: 'relative' }}>
        <SortableContext items={column.items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          {column.items.length > 0 ? (
            <div className='relative w-full' style={{ height: `${virtualizer.getTotalSize()}px` }}>
              {virtualItems.map((virtualItem: { index: number; start: number }) => {
                const contact = column.items[virtualItem.index];
                return (
                  <div
                    key={contact.id}
                    data-index={virtualItem.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    <SortableItem contact={contact} onClick={onClick} groupBy={groupBy} />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className='flex h-full items-center justify-center p-2 text-muted-foreground text-sm' data-column-id={column.id}>
              {t('drop_items_here')}
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}

// Memo the LoadingSkeleton component
const LoadingSkeleton = memo(function LoadingSkeleton() {
  // Create fixed data arrays with predefined IDs instead of using indices
  const columnSkeletons = [{ id: 'column-skeleton-1' }, { id: 'column-skeleton-2' }, { id: 'column-skeleton-3' }];

  const itemSkeletons = [{ id: 'item-skeleton-1' }, { id: 'item-skeleton-2' }, { id: 'item-skeleton-3' }, { id: 'item-skeleton-4' }, { id: 'item-skeleton-5' }];

  return (
    <div className='flex h-full gap-4 overflow-x-auto pb-4'>
      {columnSkeletons.map((column) => (
        <div key={column.id} className='flex h-full w-[280px] shrink-0 flex-col sm:w-[280px]'>
          <div className='mb-2 flex items-center justify-between'>
            <Skeleton className='h-6 w-20' />
            <Skeleton className='h-4 w-4' />
          </div>
          <div className='flex-1 space-y-2 overflow-y-auto rounded-lg border bg-muted/50 p-2'>
            {itemSkeletons.map((item) => (
              <div key={`${column.id}-${item.id}`} className='rounded-lg border bg-card p-4 shadow-sm'>
                <div className='flex items-start gap-3'>
                  <Skeleton className='size-8 rounded-full' />
                  <div className='flex-1 space-y-2'>
                    <Skeleton className='h-4 w-3/4' />
                    <Skeleton className='h-3 w-1/2' />
                    <Skeleton className='h-3 w-1/3' />
                    <div className='flex gap-2 pt-1'>
                      <Skeleton className='h-5 w-16' />
                      <Skeleton className='h-5 w-16' />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
});

export default function CRMContactsKanbanPage() {
  const router = useRouter();
  const t = useTranslations();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [showEmptyColumns, setShowEmptyColumns] = useState(true);
  const [groupBy, setGroupBy] = useState<'status' | 'priority' | 'source'>('status');
  const [sortBy, setSortBy] = useState<string>('priority');

  const { data: contactsData, isLoading } = api.contact.getAllContacts.useQuery();
  const { data: statuses } = api.site.getStatus.useQuery();
  const { data: priorities } = api.site.getPriority.useQuery();
  const { data: sources } = api.site.getSource.useQuery();

  const utils = api.useUtils();
  const updateContact = api.contact.updateContact.useMutation({
    onSuccess: () => {
      utils.contact.getAllContacts.invalidate();
      toast.success(t('contact_updated_successfully'));
    },
  });

  const [activeId, setActiveId] = useState<string | null>(null);
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const debouncedDragging = useDebounce(isDragging, 200);

  // Fix the sensor configuration to prevent "Cannot use 'in' operator to search for 'x' in undefined" error
  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 400,
        tolerance: 8,
      },
    })
  );

  const sortOptions = useMemo(() => {
    const options: SortOption[] = [];

    options.push({ value: 'name', label: t('name') });

    if (groupBy !== 'status') options.push({ value: 'status', label: t('status') });
    if (groupBy !== 'priority') options.push({ value: 'priority', label: t('priority') });
    if (groupBy !== 'source') options.push({ value: 'source', label: t('source') });

    return options;
  }, [groupBy, t]);

  useEffect(() => {
    if (sortBy === groupBy) {
      setSortBy(groupBy !== 'priority' ? 'priority' : 'name');
    }
  }, [groupBy, sortBy]);

  const filteredContacts = useMemo(() => {
    if (!contactsData) return [];

    return contactsData.filter((contact) => {
      if (debouncedSearch) {
        const searchTerm = debouncedSearch.toLowerCase();
        const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
        const email = contact.email?.toLowerCase() ?? '';
        const status = contact.status.toLowerCase();
        const source = (contact.source || '').toLowerCase();

        if (!fullName.includes(searchTerm) && !email.includes(searchTerm) && !status.includes(searchTerm) && !source.includes(searchTerm)) {
          return false;
        }
      }
      return true;
    });
  }, [contactsData, debouncedSearch]);

  // Memoize sorting function to prevent unnecessary calculations
  const sortContacts = useCallback(
    (contacts: Contact[]) => {
      return [...contacts].sort((a, b) => {
        if (sortBy === 'name') {
          return (a.name || '').localeCompare(b.name || '');
        }

        if (sortBy === 'status') {
          if (statuses) {
            const statusOrder = statuses.map((s: Status) => s.value);
            return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
          }
          return (a.status || '').localeCompare(b.status || '');
        }

        if (sortBy === 'priority') {
          if (priorities) {
            const priorityOrder = priorities.map((p: Priority) => p.value);
            return priorityOrder.indexOf(a.priority || 'Medium') - priorityOrder.indexOf(b.priority || 'Medium');
          }
          return (a.priority || 'Medium').localeCompare(b.priority || 'Medium');
        }

        if (sortBy === 'source') {
          if (sources) {
            const sourceOrder = sources.map((s: Source) => s.value);
            return sourceOrder.indexOf(a.source || '') - sourceOrder.indexOf(b.source || '');
          }
          return (a.source || '').localeCompare(b.source || '');
        }

        return 0;
      });
    },
    [sortBy, statuses, priorities, sources]
  );

  // Use a throttled/debounced column generation to prevent excess calculations
  useEffect(() => {
    if (!filteredContacts || isLoading) return;

    // Defer complex calculation to the next tick
    const timer = setTimeout(() => {
      let newColumns: KanbanColumn[] = [];
      if (groupBy === 'status' && statuses) {
        newColumns = statuses.map((status: Status) => ({
          id: status.value,
          title: status.value,
          items: sortContacts(filteredContacts.filter((contact) => contact.status === status.value)),
        }));
      } else if (groupBy === 'priority' && priorities) {
        newColumns = priorities.map((priority: Priority) => ({
          id: priority.value,
          title: priority.value,
          items: sortContacts(filteredContacts.filter((contact) => contact.priority === priority.value)),
        }));
      } else if (groupBy === 'source' && sources) {
        newColumns = sources.map((source: Source) => ({
          id: source.value,
          title: source.value,
          items: sortContacts(filteredContacts.filter((contact) => contact.source === source.value)),
        }));
      }

      setColumns(newColumns);
    }, 50); // Small delay to batch changes

    return () => clearTimeout(timer);
  }, [filteredContacts, statuses, priorities, sources, groupBy, sortContacts, isLoading]);

  const handleDragStart = (event: DragStartEvent) => {
    if (debouncedDragging) {
      return;
    }

    // Ensure we have valid data before proceeding
    if (!event.active || !event.active.id) {
      return;
    }

    setIsDragging(true);
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Add additional safeguards against undefined values
    if (!active || !active.id || !over) {
      setIsDragging(false);
      setActiveId(null);
      return;
    }

    const activeContact = filteredContacts.find((c) => c.id === active.id);
    if (!activeContact) {
      setIsDragging(false);
      setActiveId(null);
      return;
    }

    // Find source column that contains the dragged item
    const sourceColumn = columns.find((column) => column.items.some((item) => item.id === active.id));
    if (!sourceColumn) {
      setIsDragging(false);
      setActiveId(null);
      return;
    }

    // First, check if we're dropping onto a column or its empty message
    // Get column data from over
    if (over.data.current && over.data.current.type === 'column') {
      // We're dropping directly onto a column
      const targetColumn = over.data.current.column;

      if (sourceColumn.id !== targetColumn.id) {
        const updatedColumns = columns.map((column) => {
          if (column.id === sourceColumn.id) {
            return { ...column, items: column.items.filter((item) => item.id !== active.id) };
          }

          if (column.id === targetColumn.id) {
            return { ...column, items: [...column.items, activeContact] };
          }

          return column;
        });

        setColumns(updatedColumns);
        updateContact.mutate({ id: activeContact.id, [groupBy]: targetColumn.id });
        setIsDragging(false);
        setActiveId(null);
        return;
      }
    } else {
      // Check if we're dropping onto a column (by ID)
      const targetColumn = columns.find((column) => column.id === over.id);

      if (targetColumn) {
        // We're dropping directly onto a column
        if (sourceColumn.id !== targetColumn.id) {
          // Optimized column update - only update the affected columns
          const updatedColumns = columns.map((column) => {
            if (column.id === sourceColumn.id) {
              return { ...column, items: column.items.filter((item) => item.id !== active.id) };
            }

            if (column.id === targetColumn.id) {
              return { ...column, items: [...column.items, activeContact] };
            }

            return column;
          });

          setColumns(updatedColumns);
          updateContact.mutate({ id: activeContact.id, [groupBy]: targetColumn.id });
          setIsDragging(false);
          setActiveId(null);
          return;
        }
      }
    }

    // Find the column containing the over item (if it's an item and not a column)
    const overItemId = over.id as string;
    const overColumn = columns.find((column) => column.items.some((item) => item.id === overItemId));

    // If we couldn't find a column with the over ID as an item, it might be the column ID itself
    // In that case, we already handled it above, so we can return
    if (!overColumn) {
      setIsDragging(false);
      setActiveId(null);
      return;
    }

    // We're dropping onto an item in a column
    if (sourceColumn.id !== overColumn.id) {
      // Moving between columns - only update affected columns
      const updatedColumns = columns.map((column) => {
        if (column.id === sourceColumn.id) {
          return { ...column, items: column.items.filter((item) => item.id !== active.id) };
        }

        if (column.id === overColumn.id) {
          const overItemIndex = column.items.findIndex((item) => item.id === overItemId);
          if (overItemIndex === -1) {
            // Safety check - if we can't find the item, just append to the end
            return { ...column, items: [...column.items, activeContact] };
          }
          const newItems = [...column.items];
          newItems.splice(overItemIndex, 0, activeContact);
          return { ...column, items: newItems };
        }

        return column;
      });

      setColumns(updatedColumns);
      updateContact.mutate({ id: activeContact.id, [groupBy]: overColumn.id });
    } else {
      // Moving within the same column - use immer-like approach for better performance
      const activeItemIndex = sourceColumn.items.findIndex((item) => item.id === active.id);
      const overItemIndex = sourceColumn.items.findIndex((item) => item.id === overItemId);

      if (activeItemIndex !== -1 && overItemIndex !== -1 && activeItemIndex !== overItemIndex) {
        const updatedColumns = columns.map((column) => {
          if (column.id === sourceColumn.id) {
            const newItems = arrayMove([...column.items], activeItemIndex, overItemIndex);
            return { ...column, items: newItems };
          }
          return column;
        });

        setColumns(updatedColumns);
      }
    }

    setIsDragging(false);
    setActiveId(null);
  };

  const handleContactClick = useCallback(
    (id: string) => {
      router.push(`/dashboard/crm/contacts/${id}`);
    },
    [router]
  );

  return (
    <div className='space-y-4 p-4'>
      <PageHeader title={t('contacts')} subtitle={!isLoading ? `(${t('total_number_contacts', { count: filteredContacts.length || 0 })})` : undefined} description={t('contacts_description')} />

      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
          <Input placeholder={t('search_contacts')} value={search} onChange={(e) => setSearch(e.target.value)} className='h-8 w-full sm:w-72 max-w-sm' disabled={isLoading} />
          <Select value={groupBy} onValueChange={(value) => setGroupBy(value as 'status' | 'priority' | 'source')} disabled={debouncedDragging}>
            <SelectTrigger size='sm' className='h-8 w-full sm:w-[120px]'>
              <SelectValue placeholder={t('group_by')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='status'>{t('status')}</SelectItem>
              <SelectItem value='priority'>{t('priority')}</SelectItem>
              <SelectItem value='source'>{t('source')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy} disabled={debouncedDragging}>
            <SelectTrigger size='sm' className='h-8 w-full sm:w-[120px]'>
              <SelectValue placeholder={t('sort_by')} />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className='flex items-center gap-2'>
            <Checkbox
              id='show-empty-columns'
              checked={showEmptyColumns}
              onCheckedChange={(checked) => {
                if (typeof checked === 'boolean') {
                  setShowEmptyColumns(checked);
                }
              }}
              disabled={debouncedDragging}
            />
            <label htmlFor='show-empty-columns' className='text-muted-foreground text-sm'>
              {t('show_empty_columns')}
            </label>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <AddContact isLoading={isLoading || debouncedDragging} />
        </div>
      </div>

      <div className='h-[calc(100vh-200px)] overflow-hidden'>
        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <div className='flex h-full gap-4 overflow-x-auto pb-4'>
            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              collisionDetection={closestCenter}
              // Remove modifiers that might be causing issues
            >
              {columns.map((column) => (
                <DroppableColumn key={column.id} column={column} contacts={filteredContacts} onClick={handleContactClick} showEmptyColumns={showEmptyColumns} groupBy={groupBy} />
              ))}
              <DragOverlay>
                {activeId ? (
                  <div className='rounded-lg border bg-card p-4 shadow-sm'>
                    <div className='flex items-start gap-3'>
                      <Avatar className='size-8'>
                        <AvatarFallback>
                          {filteredContacts.find((c) => c.id === activeId)?.firstName?.[0] ??
                            filteredContacts.find((c) => c.id === activeId)?.name?.[0] ??
                            filteredContacts.find((c) => c.id === activeId)?.email?.[0] ??
                            ''}
                        </AvatarFallback>
                      </Avatar>
                      <div className='flex-1 space-y-1'>
                        <div className='flex items-center justify-between'>
                          <h4 className='font-medium text-sm'>{filteredContacts.find((c) => c.id === activeId)?.name}</h4>
                        </div>
                        <p className='text-muted-foreground text-xs'>{filteredContacts.find((c) => c.id === activeId)?.email}</p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        )}
      </div>
    </div>
  );
}
