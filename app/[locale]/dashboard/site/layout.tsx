import { auth } from '@/auth';
import { database } from '@/lib/database';
import { notFound } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (!session?.user) {
    return notFound();
  }

  const currentUser = await database.portal_user.findUnique({
    where: {
      id: session.user.id,
    },
  });

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return notFound();
  }

  return children;
}
