import { SessionProvider } from 'next-auth/react';

export default function LocaleProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <SessionProvider>{children}</SessionProvider>;
}
