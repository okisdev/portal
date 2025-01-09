import { auth } from '@/auth';

export default auth((req) => {
  const publicPaths = /^\/(?:login|api\/meta\/system|api\/auth\/)/;

  if (!req.auth && !publicPaths.test(req.nextUrl.pathname)) {
    const newUrl = new URL('/login', req.nextUrl.origin);
    return Response.redirect(newUrl);
  }
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
