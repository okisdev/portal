import { cn } from '@/lib/utils';

type ColorBadgeProps = {
  type: 'status' | 'contactStatus' | 'priority' | 'campaignStatus' | 'source' | 'default' | 'companyStatus';
  value: string;
  className?: string;
  isActive?: boolean;
};

export function ColorBadge({ type, value, className, isActive }: ColorBadgeProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200 hover:text-blue-900 ring-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900 ring-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800 hover:bg-red-200 hover:text-red-900 ring-red-800';
      case 'no_show':
        return 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 hover:text-neutral-900 ring-neutral-800';
      default:
        return 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 hover:text-neutral-900 ring-neutral-800';
    }
  };

  const getContactStatusColor = (contactStatus: string) => {
    switch (contactStatus) {
      case 'lead':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 hover:text-yellow-900 ring-yellow-800';
      case 'appointment':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200 hover:text-blue-900 ring-blue-800';
      case 'pitch':
        return 'bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900 ring-green-800';
      case 'trial':
        return 'bg-red-100 text-red-800 hover:bg-red-200 hover:text-red-900 ring-red-800';
      case 'final':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200 hover:text-purple-900 ring-purple-800';
      case 'closed':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200 hover:text-orange-900 ring-orange-800';
      case 'junk':
        return 'bg-red-100 text-red-800 hover:bg-red-200 hover:text-red-900 ring-red-800';
      default:
        return 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 hover:text-neutral-900 ring-neutral-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 hover:bg-red-200 hover:text-red-900 ring-red-800';
      case 'medium':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200 hover:text-orange-900 ring-orange-800';
      case 'low':
        return 'bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900 ring-green-800';
      default:
        return 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 hover:text-neutral-900 ring-neutral-800';
    }
  };

  const getCampaignStatusColor = (campaignStatus: string) => {
    switch (campaignStatus) {
      case 'active':
        return 'bg-green-100 text-green-800 ring-green-800';
      case 'draft':
        return 'bg-neutral-100 text-neutral-800 ring-neutral-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800 ring-blue-800';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800 ring-yellow-800';
      case 'paused':
        return 'bg-orange-100 text-orange-800 ring-orange-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800 ring-red-800';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'Pitching':
        return 'bg-blue-100 text-blue-800 ring-blue-800';
      case 'Referral':
        return 'bg-green-100 text-green-800 ring-green-800';
      case 'Website':
        return 'bg-yellow-100 text-yellow-800 ring-yellow-800';
      case 'Email':
        return 'bg-purple-100 text-purple-800 ring-purple-800';
      case 'IG':
        return 'bg-pink-100 text-pink-800 ring-pink-800';
      case 'LinkedIn':
        return 'bg-blue-100 text-blue-800 ring-blue-800';
      case 'Facebook':
        return 'bg-orange-100 text-orange-800 ring-orange-800';
      case 'Other':
        return 'bg-neutral-100 text-neutral-800 ring-neutral-800';
    }
  };

  const getColorClass = () => {
    switch (type) {
      case 'status':
        return getStatusColor(value);
      case 'contactStatus':
        return getContactStatusColor(value);
      case 'priority':
        return getPriorityColor(value);
      case 'campaignStatus':
        return getCampaignStatusColor(value);
      case 'source':
        return getSourceColor(value);
      default:
        return 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 hover:text-neutral-900 ring-neutral-800';
    }
  };

  const colorClass = getColorClass();
  const displayValue = value.charAt(0).toUpperCase() + value.slice(1);

  return <span className={cn('inline-block rounded-full px-1.5 py-0.5 font-medium text-xs', colorClass, className, isActive && 'ring-2 ring-offset-2 ring-offset-background')}>{displayValue}</span>;
}
