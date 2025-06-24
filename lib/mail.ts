import { Resend } from 'resend';
import { env } from '@/lib/env';

export const resend = new Resend(env.RESEND_API_KEY);

export const sendEmail = async ({
  to,
  subject,
  node,
}: {
  to: string;
  subject: string;
  node: React.ReactNode;
}) => {
  await resend.emails.send({
    from: `Portal <${env.RESEND_FROM_EMAIL}>`,
    to,
    subject,
    react: node as any,
  });
};
