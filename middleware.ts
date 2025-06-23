import createMiddleware from 'next-intl/middleware';
import { auth } from '@/auth';
import { routing } from '@/i18n/routing';

const i18nMiddleware = createMiddleware(routing);

export default auth(i18nMiddleware);

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
