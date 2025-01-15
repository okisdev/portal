import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  redirects: async () => {
    return [
      {
        source: '/dashboard/crm',
        destination: '/dashboard/crm/contacts',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
