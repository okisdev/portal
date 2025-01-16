import { accountRouter } from '@/server/routers/account';
import { adminRouter } from '@/server/routers/admin';
import { authRouter } from '@/server/routers/auth';
import { calendarRouter } from '@/server/routers/calendar';
import { contactRouter } from '@/server/routers/contact';
import { payRouter } from '@/server/routers/pay';
import { userRouter } from '@/server/routers/user';
import type { inferReactQueryProcedureOptions } from '@trpc/react-query';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import { createCallerFactory, createTRPCRouter } from './trpc';
/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  account: accountRouter,
  admin: adminRouter,
  auth: authRouter,
  calendar: calendarRouter,
  contact: contactRouter,
  pay: payRouter,
  user: userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);

export type ReactQueryOptions = inferReactQueryProcedureOptions<AppRouter>;
export type RouterInput = inferRouterInputs<AppRouter>;
export type RouterOutput = inferRouterOutputs<AppRouter>;
