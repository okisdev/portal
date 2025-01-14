import { cn } from '@/lib/utils';

type ColorBadgeProps = {
  type: 'status' | 'priority';
  value: string;
  className?: string;
};

export function ColorBadge({ type, value, className }: ColorBadgeProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
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
        return 'bg-gray-100 text-gray-800';
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
        return 'bg-gray-100 text-gray-800';
    }
  };

  const colorClass = type === 'status' ? getStatusColor(value) : getPriorityColor(value);
  const displayValue = value.charAt(0).toUpperCase() + value.slice(1);

  return <span className={cn('inline-block rounded-full px-2 py-1 text-sm', colorClass, className)}>{displayValue}</span>;
}
