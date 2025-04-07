import type { basicTagSchema } from '@/lib/schema';
import { cn } from '@/lib/utils';
import { adjustColorBrightness, getContrastColor } from '@/utils/color';
import type { z } from 'zod';

type SmartColorBadgeProps = z.infer<typeof basicTagSchema> & {
  className?: string;
  isActive?: boolean;
  hoverEffect?: boolean;
};

export function SmartColorBadge({ value, color, className, isActive, hoverEffect = true }: SmartColorBadgeProps) {
  const textColor = getContrastColor(color);
  const hoverColor = hoverEffect ? adjustColorBrightness(color, -20) : color;

  return (
    <span
      className={cn(
        'inline-block rounded-full px-1.5 py-0.5 font-medium text-xs transition-colors duration-200',
        hoverEffect && 'hover:bg-opacity-90',
        className,
        isActive && 'ring-2 ring-opacity-100 ring-offset-2 ring-offset-background'
      )}
      style={
        {
          backgroundColor: color,
          color: textColor,
          '--hover-bg': hoverColor,
        } as React.CSSProperties
      }
    >
      {value}
    </span>
  );
}
