import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import Resend from 'next-auth/providers/resend';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Resend({
      from: 'crm-no-reply@resend.okisdev.com',
      name: 'CRM',
    }),
  ],
  callbacks: {
    redirect: async ({ url, baseUrl }) => {
      if (url === '/') return baseUrl;

      return '/';
    },
  },
});
