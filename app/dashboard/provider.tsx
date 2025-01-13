import { SessionProvider } from 'next-auth/react';

export default function DashboardProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <SessionProvider>{children}</SessionProvider>;
}
