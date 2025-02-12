import { siteConfig, user } from '@/drizzle/schema';
import { generateUUID } from '@/lib/utils';
import { createTRPCRouter, publicProcedure } from '@/server/trpc';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import z from 'zod';

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { email, password } = input;

      // Check if user exists
      const existingUser = await ctx.db.select().from(user).where(eq(user.email, email));
      if (existingUser.length > 0) {
        throw new TRPCError({ code: 'CONFLICT', message: 'User already exists with this email' });
      }

      // Get allowed email domains
      const supportEmailDomainConfig = await ctx.db
        .select()
        .from(siteConfig)
        .where(eq(siteConfig.key, 'supportEmailDomain'))
        .then((rows) => rows[0]);

      if (!supportEmailDomainConfig?.value) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Registration is currently not available',
        });
      }

      // Check if email domain is allowed
      const domain = email.split('@')[1];
      const allowedDomains = supportEmailDomainConfig.value.split(',').map((d) => d.trim());
      if (!allowedDomains.includes(domain)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Registration is only allowed for support team email addresses',
        });
      }

      // Create user
      return ctx.db.insert(user).values({
        id: generateUUID(),
        email,
        password,
      });
    }),

  validateEmailDomain: publicProcedure.input(z.object({ email: z.string().email() })).query(async ({ ctx, input }) => {
    const domain = input.email.split('@')[1];
    if (!domain) return false;

    const supportEmailDomainConfig = await ctx.db
      .select()
      .from(siteConfig)
      .where(eq(siteConfig.key, 'supportEmailDomain'))
      .then((rows) => rows[0]);

    if (!supportEmailDomainConfig?.value) return false;

    const allowedDomains = supportEmailDomainConfig.value.split(',').map((d) => d.trim());
    return allowedDomains.includes(domain);
  }),
});
