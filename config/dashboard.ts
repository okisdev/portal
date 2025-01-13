import { Contact, Gift, Link, Users } from 'lucide-react';

export const crmItems = [
  {
    title: 'Contacts',
    url: '/dashboard/crm/contacts',
    icon: Contact,
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
];

export const teamItems = [
  {
    title: 'Overview',
    url: '/dashboard/team',
    icon: Users,
  },
  {
    title: 'Management',
    url: '/dashboard/team/management',
    icon: Users,
  },
];
