import { Calendar, Contact, File, Gift, QrCode, Settings, Tornado, Users } from 'lucide-react';

export const workspaceItems = [
  {
    id: 'calendar',
    title: 'Calendar',
    url: '/dashboard/workspace/calendar',
    icon: Calendar,
  },
  {
    id: 'tasks',
    title: 'Tasks',
    url: '/dashboard/workspace/tasks',
    icon: Tornado,
  },
];

export const crmItems = [
  {
    id: 'contacts',
    title: 'Contacts',
    url: '/dashboard/crm/contacts',
    icon: Contact,
  },
  {
    id: 'teams',
    title: 'Teams',
    url: '/dashboard/crm/team',
    icon: Users,
  },
  // {
  //   title: 'Payments',
  //   url: '/dashboard/crm/payments',
  //   icon: Coins,
  // },
];

export const marketingItems = [
  {
    id: 'campaigns',
    title: 'Campaigns',
    url: '/dashboard/marketing/campaigns',
    icon: Gift,
  },
  // {
  //   title: 'Payment Links',
  //   url: '/dashboard/marketing/payment-links',
  //   icon: Link,
  // },
  // {
  //   title: 'Subscription Management',
  //   url: '/dashboard/marketing/subscription-management',
  //   icon: Link,
  // },
];

export const resourcesItems = [
  {
    id: 'content',
    title: 'Content',
    url: '/dashboard/resource/content',
    icon: File,
  },
  // {
  //   title: 'Emails',
  //   url: '/dashboard/resource/emails',
  //   icon: Mail,
  // },
  // {
  //   title: 'Media',
  //   url: '/dashboard/resource/media',
  //   icon: Image,
  // },
];

export const toolsItems = [
  {
    id: 'qrcode',
    title: 'QR Code',
    url: '/dashboard/tools/qrcode',
    icon: QrCode,
  },
];

export const teamItems = [
  {
    id: 'overview',
    title: 'Overview',
    url: '/dashboard/team',
    icon: Users,
  },
  {
    id: 'configuration',
    title: 'Configuration',
    url: '/dashboard/team/configuration',
    icon: Settings,
  },
];

export const languageItems = [
  {
    id: 'en',
    title: 'English',
    value: 'en',
    flag: '🇺🇸',
  },
  {
    id: 'zh-CN',
    title: '简体中文',
    value: 'zh-CN',
    flag: '🇨🇳',
  },
  {
    id: 'zh-HK',
    title: '繁体中文',
    value: 'zh-HK',
    flag: '🇭🇰',
  },
];
