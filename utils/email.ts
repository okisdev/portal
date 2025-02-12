import { api } from '@/utils/trpc/client';
import { Resend } from 'resend';

const resend = new Resend(process.env.AUTH_RESEND_KEY);

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

export async function isAllowedEmailDomain(email: string): Promise<boolean> {
  try {
    const domain = email.split('@')[1];
    if (!domain) return false;

    const { data: supportEmailDomainConfig } = await api.site.getConfig.useQuery({ key: 'supportEmailDomain' });
    if (!supportEmailDomainConfig?.value) return false;

    const allowedDomains = supportEmailDomainConfig.value.split(',').map((d) => d.trim());
    return allowedDomains.includes(domain);
  } catch (error) {
    console.error('Error checking email domain:', error);
    return false;
  }
}
