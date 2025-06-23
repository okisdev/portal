'use client';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { api } from '@/utils/trpc/client';
import { Laptop, Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { usePathname } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';
import { validate as uuidValidate } from 'uuid';

export function DashboardHeader() {
  const pathname = usePathname();

  const t = useTranslations();

  const isMobile = useIsMobile();

  const paths = pathname.replace('/dashboard/', '').split('/');

  const [contactId, setContactId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);

  useEffect(() => {
    if (paths.includes('contacts')) {
      const id = paths[paths.length - 1];
      if (uuidValidate(id)) {
        setContactId(id);
      }
    }
    if (paths.includes('company')) {
      const id = paths[paths.length - 1];
      if (uuidValidate(id)) {
        setCompanyId(id);
      }
    }

    if (paths.includes('crm') && paths.includes('team')) {
      const id = paths[paths.length - 1];
      if (uuidValidate(id)) {
        setTeamId(id);
      }
    }
  }, [paths]);

  const { data: contact, isLoading: isContactLoading } =
    api.contact.getContactById.useQuery(
      { id: contactId || '' },
      { enabled: !!contactId }
    );
  const { data: company, isLoading: isCompanyLoading } =
    api.company.getCompanyById.useQuery(
      { id: companyId || '' },
      { enabled: !!companyId }
    );
  const { data: team, isLoading: isTeamLoading } =
    api.team.getTeamById.useQuery({ id: teamId || '' }, { enabled: !!teamId });

  const isDashboard = paths.length === 2 && paths[1] === 'dashboard';

  const [open, setOpen] = useState(false);
  const { setTheme } = useTheme();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
        if (
          (e.target instanceof HTMLElement && e.target.isContentEditable) ||
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement
        ) {
          return;
        }

        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const i18nPath = (segment: string) => {
    if (segment.trim() === '') {
      return segment;
    }

    if (uuidValidate(segment)) {
      if (paths.includes('contacts')) {
        if (isContactLoading || !contact) {
          return <Skeleton className='h-4 w-24' />;
        }
        return `${contact.firstName} ${contact.lastName}`;
      }

      if (paths.includes('company')) {
        if (isCompanyLoading || !company) {
          return <Skeleton className='h-4 w-24' />;
        }
        return company.name;
      }

      if (paths.includes('crm') && paths.includes('team')) {
        if (isTeamLoading || !team) {
          return <Skeleton className='h-4 w-24' />;
        }
        return team.name;
      }

      return segment;
    }

    return t(segment);
  };

  const runCommand = useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  return (
    <header className='sticky top-0 z-10 flex h-12 shrink-0 items-center justify-between gap-2 border-b bg-background transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'>
      <div className='flex items-center gap-2 px-4'>
        <SidebarTrigger className='-ml-1' />
        <Breadcrumb>
          <BreadcrumbList>
            {paths.map((path, index) => (
              <React.Fragment key={path}>
                <BreadcrumbItem>
                  {index === paths.length - 1 ? (
                    <BreadcrumbPage>{i18nPath(path)}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      href={`/dashboard/${paths.slice(0, index + 1).join('/')}`}
                    >
                      {i18nPath(path)}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {index < paths.length - 1 && !isDashboard && (
                  <BreadcrumbSeparator />
                )}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      {isMobile ? (
        <div />
      ) : (
        <div className='flex items-center gap-2 px-4'>
          <Button
            variant='outline'
            className={cn(
              'relative h-8 w-full justify-start rounded-[0.5rem] bg-muted/50 font-normal text-muted-foreground text-sm shadow-none sm:pr-12 md:w-40 lg:w-56 xl:w-64'
            )}
            onClick={() => setOpen(true)}
          >
            <span className='hidden lg:inline-flex'>
              {t('search_placeholder')}
            </span>
            <span className='inline-flex lg:hidden'>
              {t('search_placeholder')}
            </span>
            <kbd className='pointer-events-none absolute top-[0.3rem] right-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-medium font-mono text-[10px] opacity-100 sm:flex'>
              <span className='text-xs'>⌘</span>K
            </kbd>
          </Button>
          <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput placeholder={t('search_placeholder')} />
            <CommandList>
              <CommandEmpty>{t('no_results_found')}</CommandEmpty>

              <CommandGroup heading={t('theme')}>
                <CommandItem
                  onSelect={() => runCommand(() => setTheme('light'))}
                >
                  <Sun />
                  {t('light')}
                </CommandItem>
                <CommandItem
                  onSelect={() => runCommand(() => setTheme('dark'))}
                >
                  <Moon />
                  {t('dark')}
                </CommandItem>
                <CommandItem
                  onSelect={() => runCommand(() => setTheme('system'))}
                >
                  <Laptop />
                  {t('system')}
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </CommandDialog>
        </div>
      )}
    </header>
  );
}
