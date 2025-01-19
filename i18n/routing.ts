import { createNavigation } from 'next-intl/navigation';
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'zh-HK', 'zh-CN'],

  defaultLocale: 'zh-HK',

  localePrefix: {
    mode: 'never',
  },
});

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
