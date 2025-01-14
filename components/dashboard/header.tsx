'use client';

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';
import React from 'react';

export function DashboardHeader() {
  const pathname = usePathname();

  const paths = pathname.replace('/dashboard/', '').split('/');

  const formatPathSegment = (segment: string) => {
    const words = segment.split('-');

    return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <header className='sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 border-b bg-background transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12'>
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
                {index < paths.length - 1 && <BreadcrumbSeparator />}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
}
