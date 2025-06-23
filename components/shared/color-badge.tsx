import { cn } from '@/lib/utils';

type ColorBadgeProps = {
  type:
    | 'status'
    | 'contactStatus'
    | 'priority'
    | 'source'
    | 'default'
    | 'companyStatus';
  value: string;
  color?: string;
  className?: string;
  isActive?: boolean;
};

export function ColorBadge({
  type,
  value,
  color,
  className,
  isActive,
}: ColorBadgeProps) {
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

  const getCompanyStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900 ring-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800 hover:bg-red-200 hover:text-red-900 ring-red-800';
      default:
        return 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 hover:text-neutral-900 ring-neutral-800';
    }
  };

  const getColorClass = () => {
    // If color is provided, use it directly
    if (color) {
      return `bg-[${color}]-100 text-[${color}]-800 hover:bg-[${color}]-200 hover:text-[${color}]-900 ring-[${color}]-800`;
    }

    // Fallback to switch cases for status types that don't have color in database
    switch (type) {
      case 'status':
        return getStatusColor(value);
      case 'companyStatus':
        return getCompanyStatusColor(value);
      default:
        return 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 hover:text-neutral-900 ring-neutral-800';
    }
  };

  const colorClass = getColorClass();
  const displayValue = () => {
    switch (type) {
      case 'contactStatus':
        return value
          .replaceAll('_', ' ')
          .replace(/\b\w/g, (char) => char.toUpperCase());
      default:
        return value.charAt(0).toUpperCase() + value.slice(1);
    }
  };

  return (
    <span
      className={cn(
        'inline-block rounded-full px-1.5 py-0.5 font-medium text-xs',
        colorClass,
        className,
        isActive && 'ring-2 ring-offset-2 ring-offset-background'
      )}
    >
      {displayValue()}
    </span>
  );
}
