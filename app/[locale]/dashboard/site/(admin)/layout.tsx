import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { user } from '@/drizzle/schema';
import { auth } from '@/lib/auth';
import { database } from '@/lib/database';

export default async function SiteAdminLayout({
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
