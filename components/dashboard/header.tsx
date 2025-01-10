'use client';

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { crmItems, marketingItems } from '@/config/dashboard';
import { usePathname } from 'next/navigation';

export function DashboardHeader() {
  const pathname = usePathname();

  const isCrm = pathname.startsWith('/dashboard/crm');
  const isMarketing = pathname.startsWith('/dashboard/marketing');

  const items = isCrm ? crmItems : marketingItems;

  return (
    <header className='flex h-12 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12'>
      <div className='flex items-center gap-2 px-4'>
        <SidebarTrigger className='-ml-1' />
        <Separator orientation='vertical' className='mr-2 h-4' />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className='hidden md:block'>
              <BreadcrumbLink href={isCrm ? '/dashboard/crm' : '/dashboard/marketing'}>{isCrm ? 'CRM' : 'Marketing'}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className='hidden md:block' />
            <BreadcrumbItem>
              <BreadcrumbPage>{items[items.length - 1].title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
}
