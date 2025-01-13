import 'next-auth';

declare module 'next-auth' {
  interface User {
    firstName?: string;
    lastName?: string;
  }

  interface Session {
    user: {
      id: string;
      firstName?: string;
      lastName?: string;
      email?: string | null;
      image?: string | null;
      name?: string | null;
    };
  }

  interface JWT {
    firstName?: string;
    lastName?: string;
  }
}
