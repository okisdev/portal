import { AlertCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BannerProps {
  title: string;
  description?: string;
  variant?: 'warning' | 'success' | 'error' | 'info';
  action?: {
    label: string;
    icon?: ReactNode;
    onClick: () => void;
  };
}

const variantStyles = {
  warning: {
    container: 'bg-yellow-50',
    icon: 'text-yellow-600',
    title: 'text-yellow-800',
    description: 'text-yellow-700',
  },
  success: {
    container: 'bg-green-50',
    icon: 'text-green-600',
    title: 'text-green-800',
    description: 'text-green-700',
  },
  error: {
    container: 'bg-red-50',
    icon: 'text-red-600',
    title: 'text-red-800',
    description: 'text-red-700',
  },
  info: {
    container: 'bg-blue-50',
    icon: 'text-blue-600',
    title: 'text-blue-800',
    description: 'text-blue-700',
  },
};

export function Banner({
  title,
  description,
  variant = 'info',
  action,
}: BannerProps) {
  const styles = variantStyles[variant];

  return (
    <div className={cn('space-y-2 rounded-lg border p-4', styles.container)}>
      <div className='flex items-center gap-2'>
        <AlertCircle className={cn('h-5 w-5', styles.icon)} />
        <h3 className={cn('font-medium', styles.title)}>{title}</h3>
      </div>
      {description && (
        <p className={cn('text-sm', styles.description)}>{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} size='sm' variant='outline'>
          {action.icon}
          {action.label}
        </Button>
      )}
    </div>
  );
}
