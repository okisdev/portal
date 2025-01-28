import { type ClassValue, clsx } from 'clsx';
import { format } from 'date-fns';
import { enUS, zhCN, zhHK } from 'date-fns/locale';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const localeMap = {
  en: enUS,
  'zh-HK': zhHK,
  'zh-CN': zhCN,
  'en-US': enUS,
} as const;

export function formatDate(date: Date, locale = typeof window !== 'undefined' ? window.navigator.language : 'en-US') {
  // Get the base locale (e.g., 'en' from 'en-US')
  const baseLocale = locale.split('-')[0] as keyof typeof localeMap;
  const dateLocale = localeMap[locale as keyof typeof localeMap] || localeMap[baseLocale] || enUS;

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
