import type { Locale } from '@/types/i18n';
import { type Locale as DateFnsLocale, format } from 'date-fns';
import { enUS, zhCN, zhHK } from 'date-fns/locale';

export const dateLocaleMap: Record<Locale, DateFnsLocale> = {
  en: enUS,
  'zh-HK': zhHK,
  'zh-CN': zhCN,
} as const;

export function formatDate(date: Date, locale: Locale = (typeof window !== 'undefined' ? window.navigator.language : 'en') as Locale) {
  const dateLocale = dateLocaleMap[locale] || enUS;

  return format(date, 'PP HH:mm', {
    locale: dateLocale,
  });
}
