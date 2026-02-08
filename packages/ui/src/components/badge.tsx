/*
 * OpenOrder - Open-source restaurant ordering platform
 * Copyright (C) 2026  Josh Gunning
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const badgeVariants = cva(
  [
    'inline-flex items-center',
    'text-xs font-medium',
    'border rounded-full',
    'transition-colors duration-200',
  ].join(' '),
  {
    variants: {
      variant: {
        default: [
          'bg-gray-100 text-gray-700 border-gray-200',
          'dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700',
        ].join(' '),
        primary: [
          'bg-brand-100 text-brand-700 border-brand-200',
          'dark:bg-brand-900 dark:text-brand-200 dark:border-brand-800',
        ].join(' '),
        success: [
          'bg-green-100 text-green-700 border-green-200',
          'dark:bg-green-900 dark:text-green-200 dark:border-green-800',
        ].join(' '),
        error: [
          'bg-red-100 text-red-700 border-red-200',
          'dark:bg-red-900 dark:text-red-200 dark:border-red-800',
        ].join(' '),
        warning: [
          'bg-amber-100 text-amber-700 border-amber-200',
          'dark:bg-amber-900 dark:text-amber-200 dark:border-amber-800',
        ].join(' '),
        info: [
          'bg-blue-100 text-blue-700 border-blue-200',
          'dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800',
        ].join(' '),
        outline: [
          'bg-transparent text-gray-700 border-gray-300',
          'dark:text-gray-200 dark:border-gray-600',
        ].join(' '),
      },
      size: {
        sm: 'px-2 py-0.5 text-xs', // Base 8: 8px horizontal, 2px vertical (exception for badges)
        md: 'px-3 py-1 text-xs', // Base 8: 12px horizontal, 4px vertical (exception for badges)
        lg: 'px-4 py-1 text-sm', // Base 8: 16px horizontal, 4px vertical (exception for badges)
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /**
   * Icon to show on the left side
   */
  leftIcon?: React.ReactNode;
  /**
   * Icon to show on the right side
   */
  rightIcon?: React.ReactNode;
  /**
   * Show dot indicator
   */
  dot?: boolean;
  /**
   * Dot color (defaults to variant color)
   */
  dotColor?: string;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant,
      size,
      leftIcon,
      rightIcon,
      dot = false,
      dotColor,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size, className }))}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'mr-1.5 h-2 w-2 rounded-full',
              !dotColor && {
                'bg-gray-500': variant === 'default' || variant === 'outline',
                'bg-brand-600': variant === 'primary',
                'bg-green-600': variant === 'success',
                'bg-red-600': variant === 'error',
                'bg-amber-600': variant === 'warning',
                'bg-blue-600': variant === 'info',
              }
            )}
            style={dotColor ? { backgroundColor: dotColor } : undefined}
            aria-hidden="true"
          />
        )}
        {leftIcon && <span className="mr-1">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="ml-1">{rightIcon}</span>}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge, badgeVariants };
