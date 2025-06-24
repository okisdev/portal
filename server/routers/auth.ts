import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod/v4';
import { siteConfig, user } from '@/drizzle/schema';
import { createTRPCRouter, publicProcedure } from '@/server/trpc';

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { email, password, firstName, lastName } = input;

      // Check if user exists
      const existingUser = await ctx.db
        .select()
        .from(user)
        .where(eq(user.email, email));
      if (existingUser.length > 0) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User already exists with this email',
        });
      }

      // Get allowed email domains
      const supportEmailDomainConfig = await ctx.db
        .select()
        .from(siteConfig)
        .where(eq(siteConfig.key, 'supportEmailDomains'))
        .then((rows) => rows[0]);

      // If no domains are configured, allow all domains
      if (
        !supportEmailDomainConfig?.value ||
        supportEmailDomainConfig.value.trim() === ''
      ) {
        // Create user since there are no domain restrictions
        return ctx.db.insert(user).values({
          id: uuidv4(),
          email,
          password,
          firstName,
          lastName,
          name: `${firstName} ${lastName}`,
        });
      }

      // Check if email domain is allowed
      const domain = email.split('@')[1];
      const allowedDomains = supportEmailDomainConfig.value
        .split(',')
        .map((d) => d.trim());
      if (!allowedDomains.includes(domain)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message:
            'Registration is only allowed for support team email addresses',
        });
      }

      // Create user
      return ctx.db.insert(user).values({
        id: uuidv4(),
        email,
        password,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
      });
    }),

  validateEmailDomain: publicProcedure
    .input(z.object({ email: z.email() }))
    .query(async ({ ctx, input }) => {
      const domain = input.email.split('@')[1];
      if (!domain) return false;

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
