import User from '@/database/models/User';
import { connectToDatabase } from '@/lib/database';

export const getUserFromDb = async (email: string) => {
  await connectToDatabase();
  const user = await User.findOne({ email });
  if (!user) return null;
  return user.toObject();
};
