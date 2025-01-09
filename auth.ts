import { database } from '@/lib/database';
import { PrismaAdapter } from '@auth/prisma-adapter';
import NextAuth from 'next-auth';
import Resend from 'next-auth/providers/resend';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(database),
  providers: [
    Resend({
      from: 'crm-no-reply@resend.okisdev.com',
      name: 'CRM',
    }),
  ],
  session: { strategy: 'jwt' },
});
