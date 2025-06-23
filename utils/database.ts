import { eq } from 'drizzle-orm';
import { user } from '@/drizzle/schema';
import { database } from '@/lib/database';

export const getUserFromDb = async (email: string) => {
  return await database
    .select()
    .from(user)
    .where(eq(user.email, email))
    .then((rows) => rows[0]);
};
