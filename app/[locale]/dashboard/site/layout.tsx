import { auth } from '@/auth';
import { User } from '@/database/models/user';
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

  const currentUser = await User.findById(session.user.id);

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return notFound();
  }

  return children;
}
