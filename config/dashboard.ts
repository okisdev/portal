import { Coins, Contact, Gift, Link, Settings, Users } from 'lucide-react';

export const crmItems = [
  {
    title: 'Contacts',
    url: '/dashboard/crm/contacts',
    icon: Contact,
  },
  {
    title: 'Payments',
    url: '/dashboard/crm/payments',
    icon: Coins,
  },
];

export const marketingItems = [
  {
    title: 'Campaigns',
    url: '/dashboard/marketing/campaigns',
    icon: Gift,
  },
  {
    title: 'Payment Links',
    url: '/dashboard/marketing/payment-links',
    icon: Link,
  },
  {
    title: 'Subscription Management',
    url: '/dashboard/marketing/subscription-management',
    icon: Link,
  },
];

export const teamItems = [
  {
    title: 'Overview',
    url: '/dashboard/team',
    icon: Users,
  },
  {
    title: 'Configuration',
    url: '/dashboard/team/configuration',
    icon: Settings,
  },
];
