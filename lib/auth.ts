import * as schema from '@/drizzle/schema';
import { database } from '@/lib/database';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(database, {
    provider: 'pg',
    schema: {
      ...schema,
      portal_user: schema.user,
      portal_session: schema.session,
      portal_account: schema.account,
      portal_verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
});
