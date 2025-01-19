'use client';

import { Laptop, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { Bell } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';

export function DashboardHeader() {
  const pathname = usePathname();

  const paths = pathname.replace('/dashboard/', '').split('/');

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

  const formatPathSegment = (segment: string) => {
    const words = segment.split('-');

    return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const runCommand = useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  return (
    <header className='sticky top-0 z-10 flex h-12 shrink-0 items-center justify-between gap-2 border-b bg-background transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12'>
      <div className='flex items-center gap-2 px-4'>
        <SidebarTrigger className='-ml-1' />
        <Separator orientation='vertical' className='mr-2 h-4' />
        <Breadcrumb>
          <BreadcrumbList>
            {paths.map((path, index) => (
              <React.Fragment key={path}>
                <BreadcrumbItem>
                  {index === paths.length - 1 ? (
                    <BreadcrumbPage>{formatPathSegment(path)}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={`/dashboard/${paths.slice(0, index + 1).join('/')}`}>{formatPathSegment(path)}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {index < paths.length - 1 && !isDashboard && <BreadcrumbSeparator />}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className='flex items-center gap-2 px-4'>
        <Button
          variant='outline'
          className={cn('relative h-8 w-full justify-start rounded-[0.5rem] bg-muted/50 font-normal text-muted-foreground text-sm shadow-none sm:pr-12 md:w-40 lg:w-56 xl:w-64')}
          onClick={() => setOpen(true)}
        >
          <span className='hidden lg:inline-flex'>Search documentation...</span>
          <span className='inline-flex lg:hidden'>Search...</span>
          <kbd className='pointer-events-none absolute top-[0.3rem] right-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-medium font-mono text-[10px] opacity-100 sm:flex'>
            <span className='text-xs'>⌘</span>K
          </kbd>
        </Button>
        <CommandDialog open={open} onOpenChange={setOpen}>
          <CommandInput placeholder='Type a command or search...' />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>

            <CommandGroup heading='Theme'>
              <CommandItem onSelect={() => runCommand(() => setTheme('light'))}>
                <Sun />
                Light
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => setTheme('dark'))}>
                <Moon />
                Dark
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => setTheme('system'))}>
                <Laptop />
                System
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandDialog>
        <Button type='button' variant='ghost' className='px-3 py-1' asChild>
          <Link href='/dashboard/account/notifications'>
            <Bell className='h-4 w-4' />
          </Link>
        </Button>
      </div>
    </header>
  );
}
