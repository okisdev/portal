import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Tailwind,
} from '@react-email/components';
import type * as React from 'react';

type EmailLayoutProps = {
  children: React.ReactNode;
  preview: string;
};

export const EmailLayout = ({ children, preview }: EmailLayoutProps) => {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind>
        <Body className='bg-white font-sans'>
          <Container className='mx-auto my-10 max-w-md px-4'>
            <Section className='rounded-lg border border-gray-200 bg-white p-8 shadow-sm'>
              {children}
            </Section>
            <Section className='mt-8 text-center'>
              <p className='text-gray-500 text-sm'>
                This email was sent from Portal. If you didn't request this, you
                can safely ignore this email.
              </p>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
