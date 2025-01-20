import { cn } from '@/lib/utils';

type ColorBadgeProps = {
  type: 'status' | 'contactStatus' | 'priority';
  value: string;
  className?: string;
};

export function ColorBadge({ type, value, className }: ColorBadgeProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no_show':
        return 'bg-neutral-100 text-neutral-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  const getContactStatusColor = (contactStatus: string) => {
    switch (contactStatus) {
      case 'lead':
        return 'bg-yellow-100 text-yellow-800';
      case 'prospect':
        return 'bg-blue-100 text-blue-800';
      case 'customer':
        return 'bg-green-100 text-green-800';
      case 'churned':
        return 'bg-red-100 text-red-800';
      case 'opportunity':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-orange-100 text-orange-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
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
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  const colorClass = getColorClass();
  const displayValue = value.charAt(0).toUpperCase() + value.slice(1);

  return <span className={cn('inline-block rounded-full px-1.5 py-0.5 font-medium text-xs', colorClass, className)}>{displayValue}</span>;
}
