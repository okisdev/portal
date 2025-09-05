import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return notFound();
  }

  return children;
}
