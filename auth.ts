import { DrizzleAdapter } from '@auth/drizzle-adapter';
import bcrypt from 'bcrypt-edge';
import type { User } from 'next-auth';
import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Resend from 'next-auth/providers/resend';
import * as schema from '@/drizzle/schema';
import { MagicLinkEmail } from '@/emails';
import { database } from '@/lib/database';
import { env } from '@/lib/env';
import { resend } from '@/lib/mail';
import { credentialSchema } from '@/lib/schema';
import { getUserFromDb } from '@/utils/database';
import { UnexpectedError, UserOrPasswordIncorrectError } from '@/utils/error';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(database, {
    usersTable: schema.user as any,
    accountsTable: schema.account as any,
    sessionsTable: schema.session as any,
    verificationTokensTable: schema.verificationToken as any,
  }),
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials): Promise<User | null> => {
        try {
          const { email, password } =
            await credentialSchema.parseAsync(credentials);

          const dbUser = await getUserFromDb(email);

          if (!dbUser || !dbUser.password) {
            throw new UserOrPasswordIncorrectError();
          }

          const isValidPassword = bcrypt.compareSync(password, dbUser.password);

          if (!isValidPassword) {
            throw new UserOrPasswordIncorrectError();
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
          if (error instanceof CredentialsSignin) {
            throw error;
          }
          throw new UnexpectedError(error as Error);
        }
      },
    }),
    Resend({
      apiKey: env.RESEND_API_KEY,
      from: `Portal <${env.RESEND_FROM_EMAIL}>`,
      sendVerificationRequest: async (params) => {
        const { identifier: email, url, request } = params;

        // Extract user agent and IP for security details
        const userAgent = request.headers.get('user-agent') || 'Unknown device';
        const ip =
          request.headers.get('x-forwarded-for') ||
          request.headers.get('x-real-ip') ||
          'Unknown IP';

        try {
          await resend.emails.send({
            from: `Portal <${env.RESEND_FROM_EMAIL}>`,
            to: email,
            subject: 'Sign in to Portal',
            react: MagicLinkEmail({
              email,
              magicLinkUrl: url,
              type: 'login',
              userAgent,
              ip,
              expiresInMinutes: 60,
            }),
          });
        } catch (error) {
          console.error('Failed to send magic link email:', error);
          throw new Error('Failed to send verification email');
        }
      },
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
