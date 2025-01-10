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
    <SidebarProvider>
      <DashboardSidebar />
      {/* <main className='min-h-screen w-full flex-1'>
        <SidebarTrigger />
        {children}
      </main> */}
      <SidebarInset>
        <DashboardHeader />
        <div className='flex flex-1 flex-col gap-4 p-4 pt-0'>{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
