import { database } from '@/lib/database';
import { credentialSchema } from '@/lib/schema';
import { getUserFromDb } from '@/utils/database';
import { encryptPassword } from '@/utils/password';
import { PrismaAdapter } from '@auth/prisma-adapter';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Resend from 'next-auth/providers/resend';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(database),
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        try {
          let user = null;

          const { email, password } = await credentialSchema.parseAsync(credentials);

          const pwHash = encryptPassword(password);

          user = await getUserFromDb(email, pwHash);

          if (!user) {
            throw new Error('Invalid credentials.');
          }

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
