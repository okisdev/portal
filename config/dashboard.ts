import { Calendar, Coins, Contact, File, Gift, Image, Link, Mail, Settings, Tornado, Users } from 'lucide-react';

export const personalItems = [
  {
    title: 'Calendar',
    url: '/dashboard/personal/calendar',
    icon: Calendar,
  },
  {
    title: 'Tasks',
    url: '/dashboard/personal/tasks',
    icon: Tornado,
  },
];

export const crmItems = [
  {
    title: 'Contacts',
    url: '/dashboard/crm/contacts',
    icon: Contact,
  },
  {
    title: 'Teams',
    url: '/dashboard/crm/contacts/team',
    icon: Users,
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

export const resourcesItems = [
  {
    title: 'Content',
    url: '/dashboard/resource/content',
    icon: File,
  },
  {
    title: 'Emails',
    url: '/dashboard/resource/emails',
    icon: Mail,
  },
  {
    title: 'Media',
    url: '/dashboard/resource/media',
    icon: Image,
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

export const languageItems = [
  {
    title: 'English',
    value: 'en',
    flag: '🇺🇸',
  },
  {
    title: '简体中文',
    value: 'zh-CN',
    flag: '🇨🇳',
  },
  {
    title: '繁体中文',
    value: 'zh-HK',
    flag: '🇭🇰',
  },
];
