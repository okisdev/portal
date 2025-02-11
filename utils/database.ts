import { database } from '@/lib/database';

export const getUserFromDb = async (email: string) => {
  return await database.portal_user.findUnique({
    where: {
      email,
    },
  });
};
