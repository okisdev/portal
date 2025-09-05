import { desc, eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod/v4';
import { user } from '@/drizzle/schema';
import { createTRPCRouter } from '@/server/trpc';
import { adminProcedure } from './utils';

export const adminRouter = createTRPCRouter({
  getMe: adminProcedure.query(({ ctx }) => {
    return ctx.session.user;
  }),

  getUsers: adminProcedure.query(({ ctx }) => {
    return ctx.db.select().from(user).orderBy(desc(user.createdAt));
  }),

  getUser: adminProcedure.input(z.string()).query(({ ctx, input }) => {
    return ctx.db
      .select()
      .from(user)
      .where(eq(user.id, input))
      .then((res) => res[0]);
  }),

  createUser: adminProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string(),
        role: z.enum([
          'ADMIN',
          'SALES_MANAGER',
          'SALES_ASSISTANT',
          'MANAGER',
          'USER',
        ]),
        username: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      return ctx.db
        .insert(user)
        .values({
          id: uuidv4(),
          ...input,
        })
        .execute();
    }),

  updateUser: adminProcedure
    .input(
      z.object({
        id: z.string(),
        role: z
          .enum([
            'ADMIN',
            'SALES_MANAGER',
            'SALES_ASSISTANT',
            'MANAGER',
            'USER',
          ])
          .nullish(),
        email: z.string().email().optional(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        username: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const updateData = {
        ...(input.role && { role: input.role }),
        ...(input.email && { email: input.email }),
        ...(input.firstName && { firstName: input.firstName }),
        ...(input.lastName && { lastName: input.lastName }),
        ...(input.firstName &&
          input.lastName && {
            name: `${input.firstName} ${input.lastName}`,
          }),
        ...(input.username && { username: input.username }),
      };

      return ctx.db
        .update(user)
        .set(updateData)
        .where(eq(user.id, input.id))
        .execute();
    }),

  deleteUser: adminProcedure.input(z.string()).mutation(({ ctx, input }) => {
    return ctx.db.delete(user).where(eq(user.id, input)).execute();
  }),
});
