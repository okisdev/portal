'use client';

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
import { crmItems, languageItems, marketingItems, personalItems, resourcesItems, teamItems } from '@/config/dashboard';
import { api } from '@/utils/trpc/client';
import { ChevronDown, ChevronRight, ChevronUp, Globe, Laptop, Moon, Plus, Settings, Sun, User2 } from 'lucide-react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
  const { data: me } = api.account.getMeFromDatabase.useQuery();

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href='/dashboard'>Acme Inc</Link>
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
                  <User2 /> {me?.name ?? me?.email}
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
                      <Sun className='mr-2 h-4 w-4' />
                      <span>Theme</span>
                      <ChevronRight className='ml-auto h-4 w-4' />
                    </DropdownMenuItem>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side='right'>
                    <DropdownMenuRadioGroup>
                      <DropdownMenuRadioItem value='system'>
                        <Laptop className='mr-2 h-4 w-4' />
                        <span>System</span>
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value='light'>
                        <Sun className='mr-2 h-4 w-4' />
                        <span>Light</span>
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value='dark'>
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
                    <DropdownMenuRadioGroup>
                      {languageItems.map((item) => (
                        <DropdownMenuRadioItem key={item.value} value={item.value} className='flex items-center gap-2'>
                          <span>{item.flag}</span>
                          <span>{item.title}</span>
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
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
