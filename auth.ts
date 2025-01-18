import { database } from '@/lib/database';
import { credentialSchema } from '@/lib/schema';
import { getUserFromDb } from '@/utils/database';
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

          const dbUser = await getUserFromDb(email);

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
      from: 'portal-no-reply@resend.okisdev.com',
      name: 'Portal',
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session: async ({ session, token }) => {
      session.user.id = token.id as string;
      return session;
    },
  },
});
