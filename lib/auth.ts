import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { magicLink } from 'better-auth/plugins';
import * as schema from '@/drizzle/schema';
import MagicLinkEmail from '@/emails/magic-link';
import PasswordResetEmail from '@/emails/password-reset';
import { database } from '@/lib/database';
import { env } from '@/lib/env';
import { resend, sendEmail } from '@/lib/mail';

export const auth = betterAuth({
  baseURL: env.NEXT_PUBLIC_APP_URL,
  secret: env.AUTH_SECRET,
  database: drizzleAdapter(database, {
    provider: 'pg',
    schema: {
      ...schema,
      portal_user: schema.user,
      portal_account: schema.account,
      portal_session: schema.session,
      portal_verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }, request) => {
      await sendEmail({
        to: user.email,
        subject: 'Reset your password - Peakwind',
        node: PasswordResetEmail({
          email: user.email,
          url,
          userAgent: request?.headers.get('user-agent') || '',
          ip: request?.headers.get('x-forwarded-for') || '',
        }),
      });
    },
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }, request) => {
        await resend.emails.send({
          from: `Portal <${env.RESEND_FROM_EMAIL}>`,
          to: email,
          subject: 'Sign in to Portal',
          react: MagicLinkEmail({
            email,
            magicLinkUrl: url,
            type: 'login',
            userAgent: request?.headers?.get('user-agent') || '',
            ip: request?.headers?.get('x-forwarded-for') || '',
            expiresInMinutes: 60,
          }),
        });
      },
    }),
  ],
});
