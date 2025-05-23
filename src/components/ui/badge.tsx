import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
}

export function Badge({ variant = 'default', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        variant === 'default' && 'bg-primary text-primary-foreground hover:bg-primary/80',
        variant === 'destructive' &&
          'bg-destructive text-destructive-foreground hover:bg-destructive/80',
        variant === 'outline' &&
          'border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground',
        variant === 'secondary' && 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        className
      )}
      {...props}
    />
  );
}
