import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import ReactComponentName from 'react-scan/react-component-name/webpack';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.plugins.push(ReactComponentName({}));
    return config;
  },
  redirects: async () => {
    return [
      {
        source: '/dashboard/account',
        destination: '/dashboard/account/settings',
        permanent: false,
      },
      {
        source: '/dashboard/crm',
        destination: '/dashboard/crm/contacts',
        permanent: false,
      },
      {
        source: '/dashboard/marketing',
        destination: '/dashboard/marketing/campaigns',
        permanent: false,
      },
      {
        source: '/dashboard/workspace',
        destination: '/dashboard/workspace/calendar',
        permanent: false,
      },
      {
        source: '/dashboard/resource',
        destination: '/dashboard/resource/content',
        permanent: false,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
