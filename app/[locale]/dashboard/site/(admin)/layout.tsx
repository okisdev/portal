import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { user } from '@/drizzle/schema';
import { database } from '@/lib/database';

export default async function SiteAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (!session?.user) return notFound();

  const currentUser = await database
    .select()
    .from(user)
    .where(eq(user.id, session.user.id))
    .then((res) => res[0]);

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return notFound();
  }

  return children;
}
