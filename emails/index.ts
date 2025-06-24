// Email Templates

// Re-export types for convenience
export type { ComponentProps } from 'react';
// Components
export { EmailLayout } from './components/layout';
export { default as MagicLinkEmail } from './magic-link';
export { default as PasswordResetEmail } from './password-reset';
export { default as WelcomeEmail } from './welcome';

// Email template props types
export interface PasswordResetEmailProps {
  email?: string;
  resetUrl?: string;
  userAgent?: string;
  ip?: string;
}

export interface MagicLinkEmailProps {
  email?: string;
  magicLinkUrl?: string;
  type?: 'login' | 'password-reset';
  userAgent?: string;
  ip?: string;
  expiresInMinutes?: number;
}

export interface WelcomeEmailProps {
  email?: string;
  name?: string;
  loginUrl?: string;
}
