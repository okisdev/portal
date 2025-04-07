'use client';

import { ActionAlertDialog } from '@/components/shared/action-alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { usePathname, useRouter } from '@/i18n/navigation';
import packageInfo from '@/package.json';
import { copyToClipboard } from '@/utils/clipboard';
import { api } from '@/utils/trpc/client';
import { Building, Contact, QrCode, Users } from 'lucide-react';
import { Bell, Calendar, ChevronDown, ChevronRight, ChevronUp, Globe, Laptop, LogOut, Moon, Plus, Settings, Sparkle, Sun, Verified } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import type React from 'react';
import { startTransition, useState } from 'react';

type SidebarGroupSectionProps = {
  title: string;
  items: Array<{
    id: string;
    title: string;
    url: string;
    icon: React.ComponentType;
    action?: React.ReactNode;
  }>;
  defaultOpen?: boolean;
};

export function DashboardSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const t = useTranslations();

  const HASH = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA;

  const { data: me, isLoading } = api.account.getMeFromDatabase.useQuery();
  const { data: unreadNotificationsCount } = api.user.getUnreadNotificationsCount.useQuery();

  const [showSignOutDialog, setShowSignOutDialog] = useState(false);

  const { theme, setTheme } = useTheme();

  const locale = useLocale();

  console.log(me);

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
                Portal
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroupSection
          title={t('workspace')}
          items={[
            {
              id: 'calendar',
              title: t('calendar'),
              url: '/dashboard/workspace/calendar',
              icon: Calendar,
            },
          ]}
        />
        <SidebarGroupSection
          title={t('crm')}
          items={[
            {
              id: 'contacts',
              title: t('contacts'),
              url: '/dashboard/crm/contacts',
              icon: Contact,
              action: (
                <Link href='/dashboard/crm/contacts/new'>
                  <Plus />
                  <span className='sr-only'>{t('add_contact')}</span>
                </Link>
              ),
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
        />
        {/* <SidebarGroupSection
          title={t('resources')}
          items={[
            {
              id: 'content',
              title: t('content'),
              url: '/dashboard/resource/content',
              icon: FileIcon,
            },
          ]}
        /> */}
        <SidebarGroupSection
          title={t('tools')}
          items={[
            {
              id: 'qrcode',
              title: t('qr_code'),
              url: '/dashboard/tools/qrcode',
              icon: QrCode,
            },
          ]}
        />
        <SidebarGroupSection
          title={t('site')}
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
        />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={t('settings')} asChild>
              <Link href='/dashboard/account/settings'>
                <Settings />
                <span>{t('settings')}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={t('notifications')} asChild>
              <Link href='/dashboard/account/notifications'>
                <Bell />
                {unreadNotificationsCount && unreadNotificationsCount.count > 0 && <span className='-top-0.5 -right-0.5 absolute h-1.5 w-1.5 rounded-full bg-red-500' />}
                <span>
                  {t('notifications')} {unreadNotificationsCount && unreadNotificationsCount.count > 0 && `(${unreadNotificationsCount.count})`}
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
                    <AvatarFallback>{me?.name?.charAt(0) ?? me?.email?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {isLoading ? <Skeleton className='h-4 w-[100px]' /> : <span>{me?.name ?? me?.email}</span>}
                  <ChevronUp className='ml-auto' />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side='top' className='w-(--radix-popper-anchor-width)'>
                <DropdownMenuItem asChild>
                  <Link href='/dashboard/account/settings' className='cursor-pointer'>
                    <Settings className='mr-2 h-4 w-4' />
                    <span>{t('account')}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className='cursor-pointer text-green-500'
                  onClick={() => {
                    copyToClipboard(packageInfo.version, t('version_copied_to_clipboard'));
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
                      {theme === 'system' ? <Laptop className='mr-2 h-4 w-4' /> : theme === 'dark' ? <Moon className='mr-2 h-4 w-4' /> : <Sun className='mr-2 h-4 w-4' />}
                      <span>{t('theme')}</span>
                      <ChevronRight className='ml-auto h-4 w-4' />
                    </DropdownMenuItem>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side='right'>
                    <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                      <DropdownMenuRadioItem value='system' className='flex cursor-pointer items-center gap-2' onClick={() => setTheme('system')}>
                        <Laptop className='mr-2 h-4 w-4' />
                        <span>{t('system')}</span>
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value='light' className='flex cursor-pointer items-center gap-2' onClick={() => setTheme('light')}>
                        <Sun className='mr-2 h-4 w-4' />
                        <span>{t('light')}</span>
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value='dark' className='flex cursor-pointer items-center gap-2' onClick={() => setTheme('dark')}>
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
                    <DropdownMenuRadioGroup value={locale} onValueChange={handleChangeLocale}>
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
                  <span>{t('sign_out')}</span>
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
        title={t('sign_out')}
        description={t('sign_out_description')}
        cancelText={t('cancel')}
        confirmText={t('sign_out')}
      />
    </Sidebar>
  );
}

function SidebarGroupSection({ title, items, defaultOpen = true }: SidebarGroupSectionProps) {
  return (
    <Collapsible defaultOpen={defaultOpen} className='group/collapsible' data-collapsible='icon'>
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
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton tooltip={item.title} asChild>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.action && <SidebarMenuAction asChild>{item.action}</SidebarMenuAction>}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}
