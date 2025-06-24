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

interface WelcomeEmailProps {
  email?: string;
  name?: string;
  loginUrl?: string;
}

export const WelcomeEmail = ({
  email = 'user@example.com',
  name = 'there',
  loginUrl = 'https://portal.example.com/login',
}: WelcomeEmailProps) => {
  return (
    <EmailLayout preview='Welcome to Portal!'>
      <Section className='text-center'>
        <Img
          src='https://portal.example.com/icon.png'
          width='60'
          height='60'
          alt='Portal'
          className='mx-auto mb-4'
        />
        <Heading className='mb-6 font-bold text-2xl text-gray-900'>
          Welcome to Portal!
        </Heading>
      </Section>

      <Text className='mb-4 text-gray-700'>Hi {name},</Text>

      <Text className='mb-4 text-gray-700'>
        Welcome to Portal! We're excited to have you on board. Your account has
        been successfully created with the email address:{' '}
        <strong>{email}</strong>
      </Text>

      <Text className='mb-6 text-gray-700'>
        Portal helps you streamline your business operations with powerful CRM
        tools, contact management, and team collaboration features.
      </Text>

      <Section className='my-8 text-center'>
        <Button
          href={loginUrl}
          className='inline-block rounded-lg bg-blue-600 px-6 py-3 font-medium text-white no-underline hover:bg-blue-700'
        >
          Get Started
        </Button>
      </Section>

      <Hr className='my-6 border-gray-200' />

      <Text className='mb-4 text-gray-700'>
        <strong>What's next?</strong>
      </Text>

      <Text className='mb-2 text-gray-700'>
        • Set up your profile and preferences
      </Text>
      <Text className='mb-2 text-gray-700'>
        • Import your contacts or create your first contact
      </Text>
      <Text className='mb-2 text-gray-700'>
        • Explore the dashboard and CRM features
      </Text>
      <Text className='mb-6 text-gray-700'>
        • Invite team members to collaborate
      </Text>

      <Text className='mb-4 text-gray-600 text-sm'>
        Need help getting started? Check out our{' '}
        <Link
          href='https://portal.example.com/docs'
          className='text-blue-600 no-underline'
        >
          documentation
        </Link>{' '}
        or{' '}
        <Link
          href='mailto:support@portal.example.com'
          className='text-blue-600 no-underline'
        >
          contact our support team
        </Link>
        .
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

export default WelcomeEmail;
