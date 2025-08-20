import { TRPCError } from '@trpc/server';
import bcrypt from 'bcrypt-edge';
import { and, eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod/v4';
import { siteConfig, user, verification } from '@/drizzle/schema';
import { PasswordResetEmail } from '@/emails/password-reset';
import { env } from '@/lib/env';
import { sendEmail } from '@/lib/mail';
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

  sendPasswordReset: publicProcedure
    .input(z.object({ email: z.email() }))
    .mutation(async ({ ctx, input }) => {
      const { email } = input;

      // Check if user exists
      const existingUser = await ctx.db
        .select()
        .from(user)
        .where(eq(user.email, email));

      if (existingUser.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No account found with this email address',
        });
      }

      // Generate a unique token
      const token = uuidv4();
      const expires = new Date();
      expires.setHours(expires.getHours() + 1); // Token expires in 1 hour

      // Delete any existing tokens for this email
      await ctx.db
        .delete(verification)
        .where(eq(verification.identifier, email));

      // Store the new token
      await ctx.db.insert(verification).values({
        id: uuidv4(),
        identifier: email,
        value: token,
        expiresAt: expires.toISOString(),
      });

      // Create the reset URL
      const resetUrl = `${env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

      // Get user agent and IP from request headers (if available)
      const userAgent = ctx.headers?.get('user-agent') || 'Unknown device';
      const ip =
        ctx.headers?.get('x-forwarded-for') ||
        ctx.headers?.get('x-real-ip') ||
        'Unknown IP';

      // Send the password reset email
      try {
        await sendEmail({
          to: email,
          subject: 'Reset your Portal password',
          node: PasswordResetEmail({
            email,
            resetUrl,
            userAgent,
            ip,
          }),
        });
      } catch (error) {
        console.error('Failed to send password reset email:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send password reset email',
        });
      }

      return { success: true, message: 'Password reset email sent' };
    }),

  resetPassword: publicProcedure
    .input(
      z.object({
        email: z.email(),
        password: z.string().min(8),
        token: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { email, password, token } = input;

      // Check if user exists
      const existingUser = await ctx.db
        .select()
        .from(user)
        .where(eq(user.email, email));

      if (existingUser.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No account found with this email address',
        });
      }

      // Verify the token
      const validToken = await ctx.db
        .select()
        .from(verification)
        .where(
          and(eq(verification.identifier, email), eq(verification.value, token))
        );

      if (validToken.length === 0) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired reset token',
        });
      }

      // Check if token is expired
      const tokenExpiry = new Date(validToken[0].expiresAt);
      if (tokenExpiry < new Date()) {
        // Delete expired token
        await ctx.db
          .delete(verification)
          .where(eq(verification.identifier, email));

        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Reset token has expired',
        });
      }

      // Hash the new password
      const hashedPassword = bcrypt.hashSync(password, 10);

      // Update user password
      await ctx.db
        .update(user)
        .set({ password: hashedPassword })
        .where(eq(user.email, email));

      // Delete the used token
      await ctx.db
        .delete(verification)
        .where(eq(verification.identifier, email));

      return { success: true, message: 'Password updated successfully' };
    }),
});
