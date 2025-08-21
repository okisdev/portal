import { eq } from 'drizzle-orm';
import { z } from 'zod/v4';
import { siteConfig, user } from '@/drizzle/schema';
import { createTRPCRouter, publicProcedure } from '@/server/trpc';

export const authRouter = createTRPCRouter({
  validateEmailDomain: publicProcedure
    .input(z.object({ email: z.email() }))
    .query(async ({ ctx, input }) => {
      const domain = input.email.split('@')[1];
      if (!domain) {
        return false;
      }

      // Check if user already exists
      const existingUser = await ctx.db
        .select()
        .from(user)
        .where(eq(user.email, input.email));

      if (existingUser.length > 0) {
        // Allow existing users to login regardless of domain
        return true;
      }

      const supportEmailDomainConfig = await ctx.db
        .select()
        .from(siteConfig)
        .where(eq(siteConfig.key, 'supportEmailDomains'))
        .then((rows) => rows[0]);

      // If no domains are configured or value is empty, allow all domains
      if (
        !supportEmailDomainConfig?.value ||
        supportEmailDomainConfig.value.trim() === ''
      ) {
        return true;
      }

      const allowedDomains = supportEmailDomainConfig.value
        .split(',')
        .map((d) => d.trim());
      return allowedDomains.includes(domain);
    }),
});
