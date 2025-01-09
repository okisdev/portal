import type { NextAuthConfig } from 'next-auth';
import Resend from 'next-auth/providers/resend';

export default {
  providers: [
    Resend({
      from: 'crm-no-reply@resend.okisdev.com',
      name: 'CRM',
    }),
  ],
} satisfies NextAuthConfig;
