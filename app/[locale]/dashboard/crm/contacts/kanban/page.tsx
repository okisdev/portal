'use client';

import { PageHeader } from '@/components/shared/page-header';
import { SmartColorBadge } from '@/components/shared/smart-color-badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDebounce } from '@/hooks/use-debounce';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Contact, Priority, Source, Status } from '@/lib/schema';
import type { Locale } from '@/types/i18n';
import { parsePhoneWithoutCountryCode } from '@/utils/phone';
import { api } from '@/utils/trpc/client';
import { DndContext, type DragEndEvent, DragOverlay, type DragStartEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, horizontalListSortingStrategy, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Import } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface KanbanColumn {
  id: string;
  title: string;
  items: Contact[];
}

interface SortableItemProps {
  contact: Contact;
  onClick: (id: string) => void;
  groupBy: 'status' | 'priority' | 'source';
}

function SortableItem({ contact, onClick, groupBy }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: contact.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const { data: statuses } = api.site.getStatus.useQuery();
  const { data: priorities } = api.site.getPriority.useQuery();
  const { data: sources } = api.site.getSource.useQuery();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(contact.id)}
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
        </div>
      </div>
    </div>
  );
}

interface SortableColumnProps {
  column: KanbanColumn;
  contacts: Contact[];
  onClick: (id: string) => void;
  showEmptyColumns: boolean;
  groupBy: 'status' | 'priority' | 'source';
}

function SortableColumn({ column, contacts, onClick, showEmptyColumns, groupBy }: SortableColumnProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: column.id });
  const isMobile = useIsMobile();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const { data: statuses } = api.site.getStatus.useQuery();
  const { data: priorities } = api.site.getPriority.useQuery();
  const { data: sources } = api.site.getSource.useQuery();

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
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className='flex h-full w-[280px] shrink-0 flex-col sm:w-[280px]'>
      <div className='mb-2 flex items-center justify-between'>
        <SmartColorBadge value={column.title} color={getColumnColor()} />
        <span className='text-muted-foreground text-xs'>{column.items.length}</span>
      </div>
      <div className='flex-1 space-y-2 overflow-y-auto rounded-lg border bg-muted/50 p-2'>
        <SortableContext items={column.items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          {column.items.map((contact) => (
            <SortableItem key={contact.id} contact={contact} onClick={onClick} groupBy={groupBy} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export default function CRMContactsKanbanPage() {
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const isMobile = useIsMobile();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [showEmptyColumns, setShowEmptyColumns] = useState(true);
  const [groupBy, setGroupBy] = useState<'status' | 'priority' | 'source'>('status');

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

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 300,
        tolerance: 5,
      },
    })
  );

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

  useEffect(() => {
    if (!filteredContacts) return;

    let newColumns: KanbanColumn[] = [];
    if (groupBy === 'status' && statuses) {
      newColumns = statuses.map((status: Status) => ({
        id: status.value,
        title: status.value,
        items: filteredContacts.filter((contact) => contact.status === status.value),
      }));
    } else if (groupBy === 'priority' && priorities) {
      newColumns = priorities.map((priority: Priority) => ({
        id: priority.value,
        title: priority.value,
        items: filteredContacts.filter((contact) => contact.priority === priority.value),
      }));
    } else if (groupBy === 'source' && sources) {
      newColumns = sources.map((source: Source) => ({
        id: source.value,
        title: source.value,
        items: filteredContacts.filter((contact) => contact.source === source.value),
      }));
    }

    setColumns(newColumns);
  }, [filteredContacts, statuses, priorities, sources, groupBy]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeColumn = columns.find((col) => col.items.some((item) => item.id === active.id));
    const overColumn = columns.find((col) => col.id === over.id);

    if (!activeColumn || !overColumn) return;

    const activeItems = activeColumn.items;
    const overItems = overColumn.items;

    const activeIndex = activeItems.findIndex((item) => item.id === active.id);
    const overIndex = overItems.length; // Place at the end of the target column

    if (activeColumn.id === overColumn.id) {
      const newItems = arrayMove(activeItems, activeIndex, overIndex);
      const newColumns = columns.map((col) => {
        if (col.id === activeColumn.id) {
          return { ...col, items: newItems };
        }
        return col;
      });
      setColumns(newColumns);
    } else {
      const [removed] = activeItems.splice(activeIndex, 1);
      overItems.splice(overIndex, 0, removed);

      const newColumns = columns.map((col) => {
        if (col.id === activeColumn.id) {
          return { ...col, items: activeItems };
        }
        if (col.id === overColumn.id) {
          return { ...col, items: overItems };
        }
        return col;
      });
      setColumns(newColumns);

      // Update the contact's status
      const contact = filteredContacts.find((c) => c.id === active.id);
      if (contact) {
        updateContact.mutate({
          id: contact.id,
          status: overColumn.id,
        });
      }
    }

    setActiveId(null);
  };

  const handleContactClick = (id: string) => {
    router.push(`/dashboard/crm/contacts/${id}`);
  };

  return (
    <div className='space-y-4 p-4'>
      <PageHeader title={t('contacts')} subtitle={!isLoading ? `(${t('total_number_contacts', { count: filteredContacts.length || 0 })})` : undefined} description={t('contacts_description')} />

      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
          <Input placeholder={t('search_contacts')} value={search} onChange={(e) => setSearch(e.target.value)} className='h-8 w-full sm:w-72 max-w-sm' disabled={isLoading} />
          <Select value={groupBy} onValueChange={(value) => setGroupBy(value as 'status' | 'priority' | 'source')}>
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
            />
            <label htmlFor='show-empty-columns' className='text-muted-foreground text-sm'>
              {t('show_empty_columns')}
            </label>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <Button variant='outline' size='sm' className='flex h-8 items-center gap-2' disabled={isLoading}>
            <Import className='mr-2 h-4 w-4' />
            {t('add_contact')}
          </Button>
        </div>
      </div>

      <div className='h-[calc(100vh-200px)] overflow-hidden'>
        <div className='flex h-full gap-4 overflow-x-auto pb-4'>
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <SortableContext items={columns.map((col) => col.id)} strategy={horizontalListSortingStrategy}>
              {columns.map((column) => (
                <SortableColumn key={column.id} column={column} contacts={filteredContacts} onClick={handleContactClick} showEmptyColumns={showEmptyColumns} groupBy={groupBy} />
              ))}
            </SortableContext>
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
      </div>
    </div>
  );
}
