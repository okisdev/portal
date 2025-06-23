'use client';

import { AddContact } from '@/components/dashboard/contact/add-contact';
import { PageHeader } from '@/components/shared/page-header';
import { SmartColorBadge } from '@/components/shared/smart-color-badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/use-debounce';
import type { Contact, Priority, Source, Status } from '@/lib/schema';
import { parsePhoneWithoutCountryCode } from '@/utils/phone';
import { api } from '@/utils/trpc/client';
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { closestCenter } from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useVirtualizer } from '@tanstack/react-virtual';
import { format } from 'date-fns';
import {
  ArrowUpRight,
  Calendar,
  CalendarClock,
  Clock,
  Eye,
  EyeOff,
  MoreHorizontal,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  items: Contact[];
  totalCount: number;
  hasMore: boolean;
}

// Shared ContactCard component for consistent UI
interface ContactCardProps {
  contact: Contact;
  onClickView?: (id: string) => void;
  groupBy?: 'status' | 'priority' | 'source';
  simplified?: boolean;
}

const ContactCard = memo(function ContactCard({
  contact,
  onClickView,
  groupBy,
  simplified = false,
}: ContactCardProps) {
  const t = useTranslations();
  const { data: statuses } = api.site.getStatus.useQuery();
  const { data: priorities } = api.site.getPriority.useQuery();
  const { data: sources } = api.site.getSource.useQuery();

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (onClickView) {
        // Stop propagation to prevent triggering drag events
        e.stopPropagation();
        e.preventDefault();
        e.nativeEvent.stopImmediatePropagation();

        // Call the click handler
        onClickView(contact.id);
      }
    },
    [onClickView, contact.id]
  );

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return null;
    return format(new Date(date), 'MMM d, yyyy');
  };

  const lastContacted = formatDate(contact.lastContactedAt);
  const nextFollowUp = formatDate(contact.nextFollowUpAt);
  const createdAt = formatDate(contact.createdAt);

  return (
    <div
      className={`rounded-lg border bg-card p-4 shadow-sm ${!simplified ? 'group relative' : ''}`}
    >
      <div className='flex items-start gap-3'>
        <Avatar className='size-8'>
          <AvatarFallback>
            {contact.firstName?.[0] ??
              contact.name?.[0] ??
              contact.email?.[0] ??
              ''}
          </AvatarFallback>
        </Avatar>
        <div className='flex-1 space-y-1 overflow-hidden truncate'>
          <div className='flex items-center justify-between'>
            <h4 className='font-medium text-sm'>{contact.name}</h4>
            {onClickView && (
              <Button
                variant='outline'
                size='icon'
                className='size-7 cursor-pointer'
                onClick={handleClick}
                title={t('view_contact_details')}
                data-no-dnd='true'
              >
                <ArrowUpRight className='size-4' />
              </Button>
            )}
          </div>
          <p className='text-muted-foreground text-xs'>{contact.email}</p>

          {!simplified && (
            <>
              <div className='flex items-center gap-2'>
                {contact.phone && (
                  <span className='text-muted-foreground text-xs'>
                    {parsePhoneWithoutCountryCode(contact.phone)}
                  </span>
                )}
                {contact.company && (
                  <span className='text-muted-foreground text-xs'>
                    {contact.company}
                  </span>
                )}
              </div>

              <div className='flex flex-wrap gap-2 pt-1'>
                {contact.status && groupBy !== 'status' && (
                  <SmartColorBadge
                    value={contact.status}
                    color={
                      statuses?.find((s: Status) => s.value === contact.status)
                        ?.color || '#6b7280'
                    }
                  />
                )}
                {contact.priority && groupBy !== 'priority' && (
                  <SmartColorBadge
                    value={contact.priority}
                    color={
                      priorities?.find(
                        (p: Priority) => p.value === contact.priority
                      )?.color || '#6b7280'
                    }
                  />
                )}
                {contact.source && groupBy !== 'source' && (
                  <SmartColorBadge
                    value={contact.source}
                    color={
                      sources?.find((s: Source) => s.value === contact.source)
                        ?.color || '#6b7280'
                    }
                  />
                )}
              </div>

              <div className='flex flex-col gap-1 pt-1'>
                {createdAt && (
                  <div className='flex items-center gap-1'>
                    <Calendar className='h-3 w-3 text-muted-foreground' />
                    <span className='text-muted-foreground text-xs'>
                      {t('created_at_date', { date: createdAt })}
                    </span>
                  </div>
                )}
                {lastContacted && (
                  <div className='flex items-center gap-1'>
                    <Clock className='h-3 w-3 text-muted-foreground' />
                    <span className='text-muted-foreground text-xs'>
                      {t('last_contacted_date', { date: lastContacted })}
                    </span>
                  </div>
                )}
                {nextFollowUp && (
                  <div className='flex items-center gap-1'>
                    <CalendarClock className='h-3 w-3 text-muted-foreground' />
                    <span className='text-muted-foreground text-xs'>
                      {t('next_follow_up_date', { date: nextFollowUp })}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

interface SortableItemProps {
  contact: Contact;
  onClick: (id: string) => void;
  groupBy: 'status' | 'priority' | 'source';
}

// Memoize SortableItem to prevent unnecessary re-renders
const SortableItem = memo(function SortableItem({
  contact,
  onClick,
  groupBy,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: contact.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleItemClick = useCallback(
    (id: string) => {
      // Only handle clicks if not currently dragging
      if (!isDragging) {
        onClick(id);
      }
    },
    [isDragging, onClick]
  );

  return (
    <div
      {...attributes}
      {...listeners}
      ref={setNodeRef}
      style={style}
      className='group relative cursor-move transition-colors hover:bg-accent'
    >
      <div
        className='absolute top-2 right-2 cursor-grab touch-none opacity-0 group-hover:opacity-100'
        {...attributes}
        {...listeners}
      >
        <div className='h-4 w-8 rounded-sm bg-muted/50' />
      </div>
      <ContactCard
        contact={contact}
        onClickView={handleItemClick}
        groupBy={groupBy}
      />
    </div>
  );
});

interface SortableColumnProps {
  column: KanbanColumn;
  onClick: (id: string) => void;
  showEmptyColumns: boolean;
  groupBy: 'status' | 'priority' | 'source';
  onHideColumn: (columnId: string) => void;
}

function DroppableColumn({
  column,
  onClick,
  showEmptyColumns,
  groupBy,
  onHideColumn,
}: SortableColumnProps) {
  const t = useTranslations();
  const [columnSearch, setColumnSearch] = useState('');
  const debouncedColumnSearch = useDebounce(columnSearch, 300);

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: 'column', column },
  });

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

  // Filter column items based on column search
  const filteredItems = useMemo(() => {
    if (!debouncedColumnSearch.trim()) {
      return column.items;
    }

    const searchTerm = debouncedColumnSearch.toLowerCase();
    return column.items.filter((contact) => {
      const name = `${contact.firstName} ${contact.lastName}`.toLowerCase();
      const email = (contact.email || '').toLowerCase();
      const phone = (contact.phone || '').toLowerCase();
      const company = (contact.company || '').toLowerCase();

      return (
        name.includes(searchTerm) ||
        email.includes(searchTerm) ||
        phone.includes(searchTerm) ||
        company.includes(searchTerm)
      );
    });
  }, [column.items, debouncedColumnSearch]);

  // Create virtualizer for this column
  const virtualizer = useVirtualizer({
    count: filteredItems.length,
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

  return (
    <div className='flex h-full w-[280px] shrink-0 flex-col sm:w-[280px]'>
      <div className='mb-2 flex items-center justify-between'>
        <SmartColorBadge value={column.title} color={column.color} />
        <div className='flex items-center gap-2'>
          <span className='text-muted-foreground text-xs'>
            {column.items.length}
            {column.hasMore && `/${column.totalCount}`}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' className='h-6 w-6 p-0'>
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={() => onHideColumn(column.id)}>
                <EyeOff className='mr-2 h-4 w-4' />
                {t('hide_column')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className='mb-2'>
        <Input
          placeholder={t('search_in_column')}
          value={columnSearch}
          onChange={(e) => setColumnSearch(e.target.value)}
          className='h-7 w-full text-xs'
        />
      </div>
      <div
        ref={setMultipleRefs}
        className={`flex-1 overflow-y-auto rounded-lg border p-2 ${isOver ? 'bg-accent/20' : 'bg-muted/50'}`}
        style={{ position: 'relative' }}
      >
        <SortableContext
          items={filteredItems.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          {filteredItems.length > 0 ? (
            <div
              className='relative w-full'
              style={{ height: `${virtualizer.getTotalSize()}px` }}
            >
              {virtualItems.map(
                (virtualItem: { index: number; start: number }) => {
                  const contact = filteredItems[virtualItem.index];
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
                      <SortableItem
                        contact={contact}
                        onClick={onClick}
                        groupBy={groupBy}
                      />
                    </div>
                  );
                }
              )}
            </div>
          ) : (
            <div
              className='flex h-full items-center justify-center p-2 text-muted-foreground text-sm'
              data-column-id={column.id}
            >
              {debouncedColumnSearch ? t('no_results') : t('drop_items_here')}
            </div>
          )}
        </SortableContext>
        {column.hasMore && filteredItems.length === column.items.length && (
          <div className='mt-2 text-center'>
            <Badge variant='secondary' className='text-xs'>
              {t('showing_x_of_y', {
                x: column.items.length,
                y: column.totalCount,
              })}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}

// Memo the LoadingSkeleton component
const LoadingSkeleton = memo(function LoadingSkeleton() {
  // Create fixed data arrays with predefined IDs instead of using indices
  const columnSkeletons = [
    { id: 'column-skeleton-1' },
    { id: 'column-skeleton-2' },
    { id: 'column-skeleton-3' },
    { id: 'column-skeleton-4' },
    { id: 'column-skeleton-5' },
  ];

  const itemSkeletons = [
    { id: 'item-skeleton-1' },
    { id: 'item-skeleton-2' },
    { id: 'item-skeleton-3' },
    { id: 'item-skeleton-4' },
    { id: 'item-skeleton-5' },
  ];

  return (
    <div className='flex h-full gap-4 overflow-x-auto pb-4'>
      {columnSkeletons.map((column) => (
        <div
          key={column.id}
          className='flex h-full w-[280px] shrink-0 flex-col sm:w-[280px]'
        >
          <div className='mb-2 flex items-center justify-between'>
            <Skeleton className='h-6 w-20' />
            <div className='flex items-center gap-2'>
              <Skeleton className='h-4 w-6' />
              <Skeleton className='h-4 w-4' />
            </div>
          </div>
          <div className='flex-1 space-y-2 overflow-y-auto rounded-lg border bg-muted/50 p-2'>
            {itemSkeletons.map((item) => (
              <div
                key={`${column.id}-${item.id}`}
                className='rounded-lg border bg-card p-4 shadow-sm'
              >
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
  const [groupBy, setGroupBy] = useState<'status' | 'priority' | 'source'>(
    'status'
  );
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [hasHiddenColumns, setHasHiddenColumns] = useState(false);

  // Use the new optimized kanban endpoint
  const { data: kanbanData, isLoading } =
    api.contact.getContactsForKanban.useQuery({
      groupBy,
      search: debouncedSearch,
      limit: 100, // Load up to 100 contacts per column
    });

  const utils = api.useUtils();
  const updateContact = api.contact.updateContact.useMutation({
    onSuccess: () => {
      utils.contact.getContactsForKanban.invalidate();
      toast.success(t('contact_updated_successfully'));
    },
  });

  const [activeId, setActiveId] = useState<string | null>(null);
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const debouncedDragging = useDebounce(isDragging, 200);

  // Reset hidden columns when changing group by
  useEffect(() => {
    setHiddenColumns([]);
    setHasHiddenColumns(false);
  }, [groupBy]);

  // Handle hiding a column
  const handleHideColumn = useCallback((columnId: string) => {
    setHiddenColumns((prev) => [...prev, columnId]);
    setHasHiddenColumns(true);
  }, []);

  // Handle showing all columns
  const handleShowAllColumns = useCallback(() => {
    setHiddenColumns([]);
    setHasHiddenColumns(false);
  }, []);

  // Fix the sensor configuration to prevent "Cannot use 'in' operator to search for 'x' in undefined" error
  const sensors = useSensors(
    useSensor(MouseSensor, {
      // Don't start dragging on elements marked with data-no-dnd
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      // Don't start dragging on elements marked with data-no-dnd
      activationConstraint: {
        delay: 400,
        tolerance: 8,
      },
    })
  );

  // Get all contacts from columns for drag operations
  const allContacts = useMemo(() => {
    if (!columns) return [];
    return columns.flatMap((column) => column.items);
  }, [columns]);

  // Update columns when data changes
  useEffect(() => {
    if (kanbanData?.columns) {
      setColumns(kanbanData.columns);
    }
  }, [kanbanData]);

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

    const activeContact = allContacts.find((c) => c.id === active.id);
    if (!activeContact) {
      setIsDragging(false);
      setActiveId(null);
      return;
    }

    // Find source column that contains the dragged item
    const sourceColumn = columns.find((column) =>
      column.items.some((item) => item.id === active.id)
    );
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
            return {
              ...column,
              items: column.items.filter((item) => item.id !== active.id),
              totalCount: column.totalCount - 1,
            };
          }

          if (column.id === targetColumn.id) {
            return {
              ...column,
              items: [...column.items, activeContact],
              totalCount: column.totalCount + 1,
            };
          }

          return column;
        });

        setColumns(updatedColumns);
        updateContact.mutate({
          id: activeContact.id,
          [groupBy]: targetColumn.id,
        });
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
              return {
                ...column,
                items: column.items.filter((item) => item.id !== active.id),
                totalCount: column.totalCount - 1,
              };
            }

            if (column.id === targetColumn.id) {
              return {
                ...column,
                items: [...column.items, activeContact],
                totalCount: column.totalCount + 1,
              };
            }

            return column;
          });

          setColumns(updatedColumns);
          updateContact.mutate({
            id: activeContact.id,
            [groupBy]: targetColumn.id,
          });
          setIsDragging(false);
          setActiveId(null);
          return;
        }
      }
    }

    // Find the column containing the over item (if it's an item and not a column)
    const overItemId = over.id as string;
    const overColumn = columns.find((column) =>
      column.items.some((item) => item.id === overItemId)
    );

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
          return {
            ...column,
            items: column.items.filter((item) => item.id !== active.id),
            totalCount: column.totalCount - 1,
          };
        }

        if (column.id === overColumn.id) {
          const overItemIndex = column.items.findIndex(
            (item) => item.id === overItemId
          );
          if (overItemIndex === -1) {
            // Safety check - if we can't find the item, just append to the end
            return {
              ...column,
              items: [...column.items, activeContact],
              totalCount: column.totalCount + 1,
            };
          }
          const newItems = [...column.items];
          newItems.splice(overItemIndex, 0, activeContact);
          return {
            ...column,
            items: newItems,
            totalCount: column.totalCount + 1,
          };
        }

        return column;
      });

      setColumns(updatedColumns);
      updateContact.mutate({ id: activeContact.id, [groupBy]: overColumn.id });
    } else {
      // Moving within the same column - use immer-like approach for better performance
      const activeItemIndex = sourceColumn.items.findIndex(
        (item) => item.id === active.id
      );
      const overItemIndex = sourceColumn.items.findIndex(
        (item) => item.id === overItemId
      );

      if (
        activeItemIndex !== -1 &&
        overItemIndex !== -1 &&
        activeItemIndex !== overItemIndex
      ) {
        const updatedColumns = columns.map((column) => {
          if (column.id === sourceColumn.id) {
            const newItems = arrayMove(
              [...column.items],
              activeItemIndex,
              overItemIndex
            );
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

  // Filter out hidden columns
  const visibleColumns = useMemo(() => {
    return columns.filter((column) => !hiddenColumns.includes(column.id));
  }, [columns, hiddenColumns]);

  // Calculate total contacts across all columns
  const totalContacts = useMemo(() => {
    return columns.reduce((sum, column) => sum + column.totalCount, 0);
  }, [columns]);

  return (
    <div className='space-y-4 p-4'>
      <PageHeader
        title={t('contacts')}
        subtitle={
          !isLoading
            ? `(${t('total_number_contacts', { count: totalContacts })})`
            : undefined
        }
        description={t('contacts_description')}
      />

      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
          <Input
            placeholder={t('search_contacts')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='h-8 w-full max-w-sm sm:w-72'
            disabled={isLoading}
          />
          <Select
            value={groupBy}
            onValueChange={(value) =>
              setGroupBy(value as 'status' | 'priority' | 'source')
            }
            disabled={debouncedDragging}
          >
            <SelectTrigger size='sm' className='h-8 w-full sm:w-[120px]'>
              <SelectValue placeholder={t('group_by')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='status'>{t('status')}</SelectItem>
              <SelectItem value='priority'>{t('priority')}</SelectItem>
              <SelectItem value='source'>{t('source')}</SelectItem>
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
            <label
              htmlFor='show-empty-columns'
              className='text-muted-foreground text-sm'
            >
              {t('show_empty_columns')}
            </label>
          </div>
          {hasHiddenColumns && (
            <Button
              variant='outline'
              size='sm'
              className='h-8'
              onClick={handleShowAllColumns}
              disabled={debouncedDragging}
            >
              <Eye className='mr-2 h-4 w-4' />
              {t('show_all_columns')}
            </Button>
          )}
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
              // Skip dragging if starting on button or other interactive elements
              autoScroll={{
                threshold: {
                  x: 0.12,
                  y: 0.12,
                },
              }}
            >
              {visibleColumns.map((column) => (
                <DroppableColumn
                  key={column.id}
                  column={column}
                  onClick={handleContactClick}
                  showEmptyColumns={showEmptyColumns}
                  groupBy={groupBy}
                  onHideColumn={handleHideColumn}
                />
              ))}
              <DragOverlay>
                {activeId ? (
                  <ContactCard
                    contact={
                      allContacts.find((c) => c.id === activeId) ||
                      allContacts[0] || {
                        id: activeId,
                        name: '',
                        email: '',
                        status: '',
                        priority: '',
                      }
                    }
                    simplified={true}
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        )}
      </div>
    </div>
  );
}
