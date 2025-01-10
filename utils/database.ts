import { user } from '@/drizzle/schema';
import { database } from '@/lib/database';
import { and, eq } from 'drizzle-orm';

export const getUserFromDb = async (email: string, pwHash: string) => {
  return await database
    .select()
    .from(user)
    .where(and(eq(user.email, email), eq(user.password, pwHash)));
};
