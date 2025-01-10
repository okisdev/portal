import { database } from '@/lib/database';

export const getUserFromDb = async (email: string, pwHash: string) => {
  return await database.user.findUnique({
    where: {
      email,
      password: pwHash,
    },
  });
};
