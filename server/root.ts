import type { inferReactQueryProcedureOptions } from '@trpc/react-query';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import { accountRouter } from '@/server/routers/account';
import { adminRouter } from '@/server/routers/admin';
import { apiKeyRouter } from '@/server/routers/api-key';
import { auditRouter } from '@/server/routers/audit';
import { authRouter } from '@/server/routers/auth';
import { calendarRouter } from '@/server/routers/calendar';
import { companyRouter } from '@/server/routers/company';
import { contactRouter } from '@/server/routers/contact';
import { resourceRouter } from '@/server/routers/resource';
import { siteRouter } from '@/server/routers/site';
import { taskRouter } from '@/server/routers/task';
import { teamRouter } from '@/server/routers/team';
import { userRouter } from '@/server/routers/user';
import { createCallerFactory, createTRPCRouter } from './trpc';
/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  account: accountRouter,
  admin: adminRouter,
  apiKey: apiKeyRouter,
  audit: auditRouter,
  auth: authRouter,
  calendar: calendarRouter,
  contact: contactRouter,
  company: companyRouter,
  team: teamRouter,
  user: userRouter,
  task: taskRouter,
  resource: resourceRouter,
  site: siteRouter,
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
