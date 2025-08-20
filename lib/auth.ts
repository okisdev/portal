import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { magicLink } from 'better-auth/plugins';
import * as schema from '@/drizzle/schema';
import MagicLinkEmail from '@/emails/magic-link';
import { database } from '@/lib/database';
import { env } from '@/lib/env';
import { resend } from '@/lib/mail';

export const auth = betterAuth({
  secret: env.AUTH_SECRET,
  database: drizzleAdapter(database, {
    provider: 'pg',
    schema: {
      ...schema,
      portal_user: schema.user,
      portal_account: schema.account,
      portal_session: schema.session,
      portal_verification_token: schema.verificationToken,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  // Map existing NextAuth.js fields to Better Auth fields
  user: {
    fields: {
      emailVerified: 'emailVerified', // timestamp → boolean mapping handled by Better Auth
    },
  },
  session: {
    fields: {
      expiresAt: 'expires', // Map your existing `expires` field to Better Auth's `expiresAt`
      token: 'sessionToken', // Map your existing `sessionToken` field to Better Auth's `token`
    },
  },
  account: {
    fields: {
      providerId: 'provider', // Map your existing `provider` field to Better Auth's `providerId`
      accountId: 'providerAccountId', // Map your existing `providerAccountId` field to Better Auth's `accountId`
      refreshToken: 'refreshToken', // Already mapped correctly in your schema
      accessToken: 'accessToken', // Already mapped correctly in your schema
      accessTokenExpiresAt: 'expiresAt', // Map your existing `expiresAt` field
      idToken: 'idToken', // Already mapped correctly in your schema
    },
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, token, url }, request) => {
        await resend.emails.send({
          from: `Portal <${env.RESEND_FROM_EMAIL}>`,
          to: email,
          subject: 'Sign in to Portal',
          react: MagicLinkEmail({
            email,
            magicLinkUrl: url,
            type: 'login',
            userAgent: request?.headers.get('user-agent') || '',
            ip: request?.headers.get('x-forwarded-for') || '',
            expiresInMinutes: 60,
          }),
        });
      },
    }),
  ],
});
