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

interface PasswordResetEmailProps {
  email?: string;
  url?: string;
  userAgent?: string;
  ip?: string;
}

export const PasswordResetEmail = ({
  email = 'user@example.com',
  url = 'https://portal.example.com/reset-password?email=user@example.com&token=1234567890',
  userAgent = 'Chrome on Mac OS',
  ip = '192.168.1.1',
}: PasswordResetEmailProps) => {
  return (
    <EmailLayout preview='Reset your Portal password'>
      <Section className='text-center'>
        <Img
          alt='Portal'
          className='mx-auto mb-4'
          height='60'
          src='https://portal.vifu.org/web-app-manifest-512x512.png'
          width='60'
        />
        <Heading className='mb-6 font-bold text-2xl text-gray-900'>
          Reset your password
        </Heading>
      </Section>

      <Text className='mb-4 text-gray-700'>Hi there,</Text>

      <Text className='mb-4 text-gray-700'>
        We received a request to reset the password for your Portal account (
        {email}). If you made this request, click the button below to set a new
        password:
      </Text>

      <Section className='my-8 text-center'>
        <Button
          className='inline-block rounded-lg bg-blue-600 px-6 py-3 font-medium text-white no-underline hover:bg-blue-700'
          href={url}
        >
          Reset Password
        </Button>
      </Section>

      <Text className='mb-4 text-gray-700 text-sm'>
        If the button doesn't work, you can also copy and paste this link into
        your browser:
      </Text>

      <Text className='mb-6 break-all rounded bg-gray-50 p-3 text-gray-700 text-sm'>
        <Link className='text-blue-600 no-underline' href={url}>
          {url}
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
        If you didn't request a password reset, please ignore this email or
        <Link
          className='text-blue-600 no-underline'
          href='mailto:support@portal.example.com'
        >
          {' '}
          contact support
        </Link>{' '}
        if you have concerns.
      </Text>

      <Text className='text-gray-600 text-sm'>
        This link will expire in 1 hour for security reasons.
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

export default PasswordResetEmail;
