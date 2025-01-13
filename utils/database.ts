import { user } from '@/drizzle/schema';
import { database } from '@/lib/database';
import { eq } from 'drizzle-orm';

export const getUserFromDb = async (email: string) => {
  return await database
    .select()
    .from(user)
    .where(eq(user.email, email))
    .then((rows) => rows[0]);
};
