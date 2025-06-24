import {
  Button,
  Heading,
  Hr,
  Img,
  Link,
  Row,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './components/layout';

interface MagicLinkEmailProps {
  email?: string;
  magicLinkUrl?: string;
  type?: 'login' | 'password-reset';
  userAgent?: string;
  ip?: string;
  expiresInMinutes?: number;
}

export const MagicLinkEmail = ({
  email = 'user@example.com',
  magicLinkUrl = 'https://portal.example.com/api/auth/callback/resend?token=...',
  type = 'login',
  userAgent = 'Chrome on Mac OS',
  ip = '192.168.1.1',
  expiresInMinutes = 60,
}: MagicLinkEmailProps) => {
  const isPasswordReset = type === 'password-reset';
  const title = isPasswordReset ? 'Reset your password' : 'Sign in to Portal';
  const action = isPasswordReset ? 'Reset Password' : 'Sign In';
  const preview = isPasswordReset
    ? 'Reset your Portal password'
    : 'Your Portal sign-in link';

  return (
    <EmailLayout preview={preview}>
      <Section className='text-center'>
        <Img
          src='https://portal.example.com/icon.png'
          width='60'
          height='60'
          alt='Portal'
          className='mx-auto mb-4'
        />
        <Heading className='mb-6 font-bold text-2xl text-gray-900'>
          {title}
        </Heading>
      </Section>

      <Text className='mb-4 text-gray-700'>Hi there,</Text>

      <Text className='mb-4 text-gray-700'>
        {isPasswordReset
          ? `We received a request to reset the password for your Portal account (${email}). Click the button below to set a new password:`
          : `Click the button below to sign in to your Portal account (${email}):`}
      </Text>

      <Section className='my-8 text-center'>
        <Button
          href={magicLinkUrl}
          className='inline-block rounded-lg bg-blue-600 px-6 py-3 font-medium text-white no-underline hover:bg-blue-700'
        >
          {action}
        </Button>
      </Section>

      <Text className='mb-4 text-gray-700 text-sm'>
        If the button doesn't work, you can also copy and paste this link into
        your browser:
      </Text>

      <Text className='mb-6 break-all rounded bg-gray-50 p-3 text-gray-700 text-sm'>
        <Link href={magicLinkUrl} className='text-blue-600 no-underline'>
          {magicLinkUrl}
        </Link>
      </Text>

      <Hr className='my-6 border-gray-200' />

      <Text className='mb-4 text-gray-600 text-sm'>
        <strong>Security details:</strong>
      </Text>
      <Text className='mb-2 text-gray-600 text-sm'>
        • Request made from: {userAgent}
      </Text>
      <Text className='mb-4 text-gray-600 text-sm'>• IP address: {ip}</Text>

      <Text className='mb-4 text-gray-600 text-sm'>
        {isPasswordReset
          ? "If you didn't request a password reset, please ignore this email or "
          : "If you didn't request this sign-in link, please ignore this email or "}
        <Link
          href='mailto:support@portal.example.com'
          className='text-blue-600 no-underline'
        >
          contact support
        </Link>{' '}
        if you have concerns.
      </Text>

      <Text className='text-gray-600 text-sm'>
        This link will expire in {expiresInMinutes} minutes for security
        reasons.
      </Text>

      <Hr className='my-6 border-gray-200' />

      <Row>
        <Text className='text-gray-500 text-xs'>
          Best regards,
          <br />
          The Portal Team
        </Text>
      </Row>
    </EmailLayout>
  );
};

export default MagicLinkEmail;
