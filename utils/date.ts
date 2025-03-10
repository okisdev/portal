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

  // Convert to HKT for display
  const hktOffset = 8; // HKT is UTC+8
  const userOffset = date.getTimezoneOffset();
  const hktAdjustment = (hktOffset * 60 + userOffset) * 60 * 1000;
  const hktDate = new Date(date.getTime() + hktAdjustment);

  return format(hktDate, 'PP HH:mm', {
    locale: dateLocale,
  });
}
