import { getRequestConfig } from 'next-intl/server';
import type { Locale } from '@/types/i18n';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!(locale && routing.locales.includes(locale as Locale))) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`@/i18n/locales/${locale}.json`)).default,
  };
});
