import DashboardProvider from '@/app/dashboard/provider';
import { auth } from '@/auth';
import { DashboardHeader } from '@/components/dashboard/header';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (!session) return redirect('/login');

  return (
    <DashboardProvider>
      <SidebarProvider>
        <DashboardSidebar />
        <SidebarInset>
          <DashboardHeader />
          <div className='flex-1 p-4'>{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </DashboardProvider>
  );
}
