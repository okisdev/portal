import { Resend } from 'resend';
import { env } from '@/lib/env';

const resend = new Resend(env.RESEND_API_KEY);

interface SendEmailParams {
  from: string;
  to: string;
  subject: string;
  content: string;
  cc?: string[];
  bcc?: string[];
  attachments?: any[];
}

export async function sendHtmlEmail({
  from,
  to,
  subject,
  content,
  cc,
  bcc,
  attachments,
}: SendEmailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: `Portal <${env.RESEND_FROM_EMAIL}>`,
      to,
      subject,
      html: content,
      cc,
      bcc,
      attachments: attachments?.map((file) => ({
        filename: file.name,
        content: file,
      })),
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}
