import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { generateUUID } from '@/lib/utils';

const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const currentUser = await ctx.db.portal_user.findUnique({
    where: {
      id: ctx.session.user.id,
    },
  });

  if (!currentUser || currentUser.role !== 'ADMIN') {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Only admins can access this resource',
    });
  }

  return next();
});

export const adminRouter = createTRPCRouter({
  getMe: adminProcedure.query(({ ctx }) => {
    return ctx.session.user;
  }),

  getUsers: adminProcedure.query(({ ctx }) => {
    return ctx.db.portal_user.findMany();
  }),

  getUser: adminProcedure.input(z.string()).query(({ ctx, input }) => {
    return ctx.db.portal_user.findUnique({
      where: {
        id: input,
      },
    });
  }),

  createUser: adminProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string(),
        role: z.enum(['ADMIN', 'SALES', 'MANAGER', 'USER']),
        username: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      return ctx.db.portal_user.create({
        data: {
          id: generateUUID(),
          ...input,
        },
      });
    }),

  updateUser: adminProcedure
    .input(
      z.object({
        id: z.string(),
        role: z.enum(['ADMIN', 'SALES', 'MANAGER', 'USER']).nullish(),
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

      return ctx.db.portal_user.update({
        where: {
          id: input.id,
        },
        data: updateData,
      });
    }),

  deleteUser: adminProcedure.input(z.string()).mutation(({ ctx, input }) => {
    return ctx.db.portal_user.delete({
      where: {
        id: input,
      },
    });
  }),
});
