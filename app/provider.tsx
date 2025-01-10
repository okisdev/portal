import { TRPCReactProvider } from '@/utils/trpc/client';

export default function RootProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <TRPCReactProvider>{children}</TRPCReactProvider>;
}
