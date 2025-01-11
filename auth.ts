import { database } from '@/lib/database';
import { credentialSchema } from '@/lib/schema';
import { getUserFromDb } from '@/utils/database';
import { encryptPassword } from '@/utils/password';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import bcrypt from 'bcrypt-edge';
import NextAuth from 'next-auth';
import type { User } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Resend from 'next-auth/providers/resend';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(database),
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials): Promise<User | null> => {
        try {
          const { email, password } = await credentialSchema.parseAsync(credentials);

          const pwHash = encryptPassword(password);

          console.log(email, pwHash);

          const dbUser = await getUserFromDb(email);

          console.log(dbUser);

          if (!dbUser || !dbUser.password) {
            throw new Error('Invalid credentials.');
          }

          const isValidPassword = bcrypt.compareSync(password, dbUser.password);

          if (!isValidPassword) {
            throw new Error('Invalid credentials.');
          }

          const user: User = {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            image: dbUser.image,
          };

          return user;
        } catch (error) {
          console.error(error);
          throw new Error('Invalid credentials.');
        }
      },
    }),
    Resend({
      from: 'crm-no-reply@resend.okisdev.com',
      name: 'CRM',
    }),
  ],
  session: { strategy: 'jwt' },
});
