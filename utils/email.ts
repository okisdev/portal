import { env } from '@/lib/env';
import { Resend } from 'resend';

const resend = new Resend(env.AUTH_RESEND_KEY);

interface SendEmailParams {
  from: string;
  to: string;
  subject: string;
  content: string;
  cc?: string[];
  bcc?: string[];
  attachments?: any[];
}

export async function sendEmail({ from, to, subject, content, cc, bcc, attachments }: SendEmailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Portal <portal@mail.vifu.org>',
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
