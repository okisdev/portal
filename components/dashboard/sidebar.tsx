'use client';

import {
  Bell,
  Building,
  Calendar,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Contact,
  Globe,
  Kanban,
  Laptop,
  LogOut,
  Moon,
  Plus,
  Settings,
  Sparkle,
  Sun,
  Table,
  Users,
  Verified,
} from 'lucide-react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import type React from 'react';
import { startTransition, useState } from 'react';
import { ActionAlertDialog } from '@/components/shared/action-alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  SidebarMenuSub,
} from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { usePathname, useRouter } from '@/i18n/navigation';
import { authClient } from '@/lib/auth.client';
import packageInfo from '@/package.json' with { type: 'json' };
import { copyToClipboard } from '@/utils/clipboard';
import { api } from '@/utils/trpc/client';

interface SidebarGroupSectionProps {
  title: string;
  items: Array<{
    id: string;
    title: string;
    url?: string;
    icon: React.ComponentType;
    action?: React.ReactNode;
    items?: Array<{
      id: string;
      title: string;
      url: string;
      icon: React.ComponentType;
    }>;
  }>;
  defaultOpen?: boolean;
}

export function DashboardSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const t = useTranslations();

  const HASH = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA;

  const { data: workspaceName, isLoading: isWorkspaceNameLoading } =
    api.site.getConfig.useQuery({ key: 'name' });

  const { data: me, isLoading } = api.account.getMeFromDatabase.useQuery();
  const { data: unreadNotificationsCount } =
    api.user.getUnreadNotificationsCount.useQuery();

  const [showSignOutDialog, setShowSignOutDialog] = useState(false);

  const { theme, setTheme } = useTheme();

  const locale = useLocale();

  const handleChangeLocale = (locale: string) => {
    startTransition(() => {
      router.replace(pathname, { locale });
    });
  };

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href='/dashboard'>
                <Sparkle className='h-4 w-4' />
                {isWorkspaceNameLoading ? (
                  <Skeleton className='h-6 w-full' />
                ) : (
                  (workspaceName?.value ?? 'Portal')
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroupSection
          items={[
            {
              id: 'calendar',
              title: t('calendar'),
              url: '/dashboard/workspace/calendar',
              icon: Calendar,
            },
          ]}
          title={t('workspace')}
        />
        <SidebarGroupSection
          items={[
            {
              id: 'contacts',
              title: t('contacts'),
              icon: Contact,
              action: (
                <Link href='/dashboard/crm/contacts/new'>
                  <Plus />
                  <span className='sr-only'>{t('add_contact')}</span>
                </Link>
              ),
              items: [
                {
                  id: 'table',
                  title: t('table'),
                  url: '/dashboard/crm/contacts',
                  icon: Table,
                },
                {
                  id: 'kanban',
                  title: t('kanban'),
                  url: '/dashboard/crm/contacts/kanban',
                  icon: Kanban,
                },
              ],
            },
            {
              id: 'teams',
              title: t('teams'),
              url: '/dashboard/crm/team',
              icon: Users,
            },
            {
              id: 'company',
              title: t('company'),
              url: '/dashboard/crm/company',
              icon: Building,
            },
          ]}
          title={t('crm')}
        />
        <SidebarGroupSection
          items={[
            ...(me?.role === 'ADMIN'
              ? [
                  {
                    id: 'overview',
                    title: t('overview'),
                    url: '/dashboard/site',
                    icon: Users,
                  },
                ]
              : []),
            {
              id: 'management',
              title: t('management'),
              url: '/dashboard/site/management',
              icon: Settings,
            },
          ]}
          title={t('site')}
        />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={t('settings')}>
              <Link href='/dashboard/account/settings'>
                <Settings />
                <span>{t('settings')}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={t('notifications')}>
              <Link href='/dashboard/account/notifications'>
                <Bell />
                {unreadNotificationsCount &&
                  unreadNotificationsCount.count > 0 && (
                    <span className='-top-0.5 -right-0.5 absolute h-1.5 w-1.5 rounded-full bg-red-500' />
                  )}
                <span>
                  {t('notifications')}{' '}
                  {unreadNotificationsCount &&
                    unreadNotificationsCount.count > 0 &&
                    `(${unreadNotificationsCount.count})`}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem className='flex items-center justify-between space-x-1'>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton tooltip={t('account')}>
                  <Avatar className='h-4 w-4'>
                    <AvatarImage src={me?.image ?? ''} />
                    <AvatarFallback>
                      {me?.name?.charAt(0) ?? me?.email?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {isLoading ? (
                    <Skeleton className='h-4 w-[100px]' />
                  ) : (
                    <span>{me?.name ?? me?.email}</span>
                  )}
                  <ChevronUp className='ml-auto' />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className='w-(--radix-popper-anchor-width)'
                side='top'
              >
                <DropdownMenuItem asChild>
                  <Link
                    className='cursor-pointer'
                    href='/dashboard/account/settings'
                  >
                    <Settings className='mr-2 h-4 w-4' />
                    <span>{t('account')}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className='cursor-pointer text-green-500'
                  onClick={() => {
                    copyToClipboard(
                      packageInfo.version,
                      t('version_copied_to_clipboard')
                    );
                  }}
                >
                  <Verified className='mr-2 h-4 w-4' />
                  <span>
                    {packageInfo.version} {HASH && `(${HASH.slice(0, 7)})`}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <DropdownMenuItem className='cursor-pointer'>
                      {theme === 'system' ? (
                        <Laptop className='mr-2 h-4 w-4' />
                      ) : theme === 'dark' ? (
                        <Moon className='mr-2 h-4 w-4' />
                      ) : (
                        <Sun className='mr-2 h-4 w-4' />
                      )}
                      <span>{t('theme')}</span>
                      <ChevronRight className='ml-auto h-4 w-4' />
                    </DropdownMenuItem>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side='right'>
                    <DropdownMenuRadioGroup
                      onValueChange={setTheme}
                      value={theme}
                    >
                      <DropdownMenuRadioItem
                        className='flex cursor-pointer items-center gap-2'
                        onClick={() => setTheme('system')}
                        value='system'
                      >
                        <Laptop className='mr-2 h-4 w-4' />
                        <span>{t('system')}</span>
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem
                        className='flex cursor-pointer items-center gap-2'
                        onClick={() => setTheme('light')}
                        value='light'
                      >
                        <Sun className='mr-2 h-4 w-4' />
                        <span>{t('light')}</span>
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem
                        className='flex cursor-pointer items-center gap-2'
                        onClick={() => setTheme('dark')}
                        value='dark'
                      >
                        <Moon className='mr-2 h-4 w-4' />
                        <span>{t('dark')}</span>
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <DropdownMenuItem className='cursor-pointer'>
                      <Globe className='mr-2 h-4 w-4' />
                      <span>{t('language')}</span>
                      <ChevronRight className='ml-auto h-4 w-4' />
                    </DropdownMenuItem>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side='right'>
                    <DropdownMenuRadioGroup
                      onValueChange={handleChangeLocale}
                      value={locale}
                    >
                      {[
                        {
                          id: 'en',
                          title: 'English',
                          value: 'en',
                          flag: '🇺🇸',
                        },
                        {
                          id: 'zh-CN',
                          title: '简体中文',
                          value: 'zh-CN',
                          flag: '🇨🇳',
                        },
                        {
                          id: 'zh-HK',
                          title: '繁体中文',
                          value: 'zh-HK',
                          flag: '🇭🇰',
                        },
                      ].map((item) => (
                        <DropdownMenuRadioItem
                          className='flex cursor-pointer items-center gap-2'
                          key={item.value}
                          value={item.value}
                        >
                          <span>{item.flag}</span>
                          <span>{item.title}</span>
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className='cursor-pointer text-red-500 dark:text-red-400'
                  onClick={() => setShowSignOutDialog(true)}
                >
                  <LogOut className='mr-2 h-4 w-4' />
                  <span>{t('sign_out')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <ActionAlertDialog
        cancelText={t('cancel')}
        confirmText={t('sign_out')}
        description={t('sign_out_description')}
        onConfirm={() => authClient.signOut()}
        onOpenChange={setShowSignOutDialog}
        open={showSignOutDialog}
        title={t('sign_out')}
      />
    </Sidebar>
  );
}

function SidebarGroupSection({
  title,
  items,
  defaultOpen = true,
}: SidebarGroupSectionProps) {
  const pathname = usePathname();

  return (
    <Collapsible
      className='group/collapsible'
      data-collapsible='icon'
      defaultOpen={defaultOpen}
    >
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
              {items.map((item) => {
                const isItemActive = item.url ? pathname === item.url : false;

                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      className={isItemActive ? 'bg-accent' : ''}
                      tooltip={item.title}
                    >
                      <Link href={item.url ?? ''}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                    {item.action && (
                      <SidebarMenuAction asChild>
                        {item.action}
                      </SidebarMenuAction>
                    )}
                    {item.items && (
                      <SidebarMenuSub>
                        {item.items.map((subItem) => {
                          const isSubItemActive = pathname === subItem.url;

                          return (
                            <SidebarMenuItem key={subItem.id}>
                              <SidebarMenuButton
                                asChild
                                className={isSubItemActive ? 'bg-accent' : ''}
                                tooltip={subItem.title}
                              >
                                <Link href={subItem.url}>
                                  <subItem.icon />
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        })}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}
