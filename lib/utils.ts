import type { Locale } from '@/types/i18n';
import { type ClassValue, clsx } from 'clsx';
import { type Locale as DateFnsLocale, format } from 'date-fns';
import { enUS, zhCN, zhHK } from 'date-fns/locale';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const localeMap: Record<Locale, DateFnsLocale> = {
  en: enUS,
  'zh-HK': zhHK,
  'zh-CN': zhCN,
} as const;

export function formatDate(date: Date, locale: Locale = (typeof window !== 'undefined' ? window.navigator.language : 'en') as Locale) {
  const dateLocale = localeMap[locale] || enUS;

  return format(date, 'PP HH:mm', {
    locale: dateLocale,
  });
}

export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function generateShortUUID(number = 10): string {
  return Math.random().toString(36).substring(2, number);
}

export function isDev() {
  return process.env.NODE_ENV === 'development';
}

export function generateCouponCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase() + Math.random().toString(36).substring(2, 10).toUpperCase();
}
