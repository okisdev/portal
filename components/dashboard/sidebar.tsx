'use client';

import { ActionAlertDialog } from '@/components/shared/action-alert-dialog';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { crmItems, languageItems, marketingItems, resourcesItems, teamItems, toolsItems, workspaceItems } from '@/config/dashboard';
import { usePathname, useRouter } from '@/i18n/routing';
import { api } from '@/utils/trpc/client';
import { Bell, ChevronDown, ChevronRight, ChevronUp, Globe, Laptop, LogOut, Moon, Plus, Settings, Sparkle, Sun, User2 } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useLocale } from 'next-intl';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import type React from 'react';
import { startTransition, useState } from 'react';

type SidebarGroupSectionProps = {
  title: string;
  items: Array<{
    title: string;
    url: string;
    icon: React.ComponentType;
  }>;
  defaultOpen?: boolean;
  onItemAction?: (title: string) => void;
};

export function DashboardSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const { data: me, isLoading } = api.account.getMeFromDatabase.useQuery();

  const [showSignOutDialog, setShowSignOutDialog] = useState(false);

  const { theme, setTheme } = useTheme();

  const locale = useLocale();

  const handleChangeLocale = (locale: string) => {
    startTransition(() => {
      router.replace(pathname, { locale });
    });
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href='/dashboard'>
                <Sparkle className='h-4 w-4' />
                Portal
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroupSection title='Workspace' items={workspaceItems} />
        <SidebarGroupSection title='CRM' items={crmItems} onItemAction={() => router.push('/dashboard/crm/contacts/new')} />
        <SidebarGroupSection title='Marketing' items={marketingItems} />
        <SidebarGroupSection title='Resources' items={resourcesItems} />
        <SidebarGroupSection title='Tools' items={toolsItems} />
        {me?.role === 'ADMIN' && <SidebarGroupSection title='Team' items={teamItems} />}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href='/dashboard/account/settings'>
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem className='flex items-center justify-between space-x-1'>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <User2 />
                  {isLoading ? <Skeleton className='h-4 w-[100px]' /> : <span>{me?.name ?? me?.email}</span>}
                  <ChevronUp className='ml-auto' />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side='top' className='w-[--radix-popper-anchor-width]'>
                <DropdownMenuItem asChild>
                  <Link href='/dashboard/account/settings' className='cursor-pointer'>
                    <Settings className='mr-2 h-4 w-4' />
                    <span>Account</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <DropdownMenuItem className='cursor-pointer'>
                      {theme === 'system' ? <Laptop className='mr-2 h-4 w-4' /> : theme === 'dark' ? <Moon className='mr-2 h-4 w-4' /> : <Sun className='mr-2 h-4 w-4' />}
                      <span>Theme</span>
                      <ChevronRight className='ml-auto h-4 w-4' />
                    </DropdownMenuItem>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side='right'>
                    <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                      <DropdownMenuRadioItem value='system' className='flex cursor-pointer items-center gap-2' onClick={() => setTheme('system')}>
                        <Laptop className='mr-2 h-4 w-4' />
                        <span>System</span>
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value='light' className='flex cursor-pointer items-center gap-2' onClick={() => setTheme('light')}>
                        <Sun className='mr-2 h-4 w-4' />
                        <span>Light</span>
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value='dark' className='flex cursor-pointer items-center gap-2' onClick={() => setTheme('dark')}>
                        <Moon className='mr-2 h-4 w-4' />
                        <span>Dark</span>
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <DropdownMenuItem className='cursor-pointer'>
                      <Globe className='mr-2 h-4 w-4' />
                      <span>Language</span>
                      <ChevronRight className='ml-auto h-4 w-4' />
                    </DropdownMenuItem>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side='right'>
                    <DropdownMenuRadioGroup value={locale} onValueChange={handleChangeLocale}>
                      {languageItems.map((item) => (
                        <DropdownMenuRadioItem key={item.value} value={item.value} className='flex cursor-pointer items-center gap-2'>
                          <span>{item.flag}</span>
                          <span>{item.title}</span>
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenuSeparator />
                <DropdownMenuItem className='cursor-pointer text-red-500 dark:text-red-400' onClick={() => setShowSignOutDialog(true)}>
                  <LogOut className='mr-2 h-4 w-4' />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button type='button' variant='ghost' className='h-8 px-2' asChild>
              <Link href='/dashboard/account/notifications'>
                <Bell className='h-4 w-4' />
              </Link>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <ActionAlertDialog
        open={showSignOutDialog}
        onOpenChange={setShowSignOutDialog}
        onConfirm={() => signOut()}
        title='Sign Out'
        description='Are you sure you want to sign out of your account?'
        cancelText='Cancel'
        confirmText='Sign Out'
      />
    </Sidebar>
  );
}

function SidebarGroupSection({ title, items, defaultOpen = true, onItemAction }: SidebarGroupSectionProps) {
  return (
    <Collapsible defaultOpen={defaultOpen} className='group/collapsible'>
      <SidebarGroup>
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger>
            {title}
            <ChevronDown className='ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180' />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  {onItemAction && item.title === 'Contacts' && (
                    <SidebarMenuAction onClick={() => onItemAction(item.title)}>
                      <Plus /> <span className='sr-only'>Add Contact</span>
                    </SidebarMenuAction>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}
