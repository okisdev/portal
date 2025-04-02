import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'zh-HK', 'zh-CN'],

  defaultLocale: 'zh-HK',

  localePrefix: {
    mode: 'never',
  },
});
