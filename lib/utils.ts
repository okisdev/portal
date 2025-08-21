import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isDev() {
  return process.env.NODE_ENV === 'development';
}

export function randomString(length: number): string {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length);
}
