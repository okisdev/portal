import { DashboardHeader } from '@/components/dashboard/header';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return redirect('/login');

  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset className='max-h-screen w-[calc(100vw-var(--sidebar-width))] overflow-hidden '>
        <DashboardHeader />
        <div className='flex-1 overflow-y-auto'>{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
