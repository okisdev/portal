import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

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

export default withNextIntl(nextConfig);
