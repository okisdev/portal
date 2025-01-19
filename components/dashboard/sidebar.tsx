'use client';

import { ActionAlertDialog } from '@/components/shared/action-alert-dialog';
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
import { crmItems, languageItems, marketingItems, personalItems, resourcesItems, teamItems } from '@/config/dashboard';
import { usePathname, useRouter } from '@/i18n/routing';
import { api } from '@/utils/trpc/client';
import { ChevronDown, ChevronRight, ChevronUp, Globe, Laptop, Moon, Plus, Settings, Sparkle, Sun, User2 } from 'lucide-react';
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
        <SidebarGroupSection title='Personal' items={personalItems} />
        <SidebarGroupSection title='CRM' items={crmItems} onItemAction={() => router.push('/dashboard/crm/contacts/new')} />
        <SidebarGroupSection title='Marketing' items={marketingItems} />
        <SidebarGroupSection title='Resources' items={resourcesItems} />
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
          <SidebarMenuItem>
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
                    <span>Account</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <DropdownMenuItem>
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
                    <DropdownMenuItem>
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
                <DropdownMenuItem className='cursor-pointer' onClick={() => setShowSignOutDialog(true)}>
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
