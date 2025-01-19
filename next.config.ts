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
        source: '/dashboard/crm',
        destination: '/dashboard/crm/contacts',
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
