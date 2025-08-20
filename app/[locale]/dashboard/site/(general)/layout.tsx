import { notFound } from 'next/navigation';
import { auth } from '@/auth';

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (!session?.user) {
    return notFound();
  }

  return children;
}
