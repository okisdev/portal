import { cn } from '@/lib/utils';

type ColorBadgeProps = {
  type: 'status' | 'contactStatus' | 'priority' | 'campaignStatus';
  value: string;
  className?: string;
};

export function ColorBadge({ type, value, className }: ColorBadgeProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200 hover:text-blue-900';
      case 'completed':
        return 'bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900';
      case 'cancelled':
        return 'bg-red-100 text-red-800 hover:bg-red-200 hover:text-red-900';
      case 'no_show':
        return 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 hover:text-neutral-900';
      default:
        return 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 hover:text-neutral-900';
    }
  };

  const getContactStatusColor = (contactStatus: string) => {
    switch (contactStatus) {
      case 'lead':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 hover:text-yellow-900';
      case 'appointment':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200 hover:text-blue-900';
      case 'pitch':
        return 'bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900';
      case 'trial':
        return 'bg-red-100 text-red-800 hover:bg-red-200 hover:text-red-900';
      case 'final':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200 hover:text-purple-900';
      case 'closed':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200 hover:text-orange-900';
      case 'junk':
        return 'bg-red-100 text-red-800 hover:bg-red-200 hover:text-red-900';
      default:
        return 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 hover:text-neutral-900';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 hover:bg-red-200 hover:text-red-900';
      case 'medium':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200 hover:text-orange-900 ';
      case 'low':
        return 'bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900';
      default:
        return 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 hover:text-neutral-900';
    }
  };

  const getCampaignStatusColor = (campaignStatus: string) => {
    switch (campaignStatus) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-neutral-100 text-neutral-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'paused':
        return 'bg-orange-100 text-orange-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
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
      default:
        return 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 hover:text-neutral-900';
    }
  };

  const colorClass = getColorClass();
  const displayValue = value.charAt(0).toUpperCase() + value.slice(1);

  return <span className={cn('inline-block rounded-full px-1.5 py-0.5 font-medium text-xs', colorClass, className)}>{displayValue}</span>;
}
