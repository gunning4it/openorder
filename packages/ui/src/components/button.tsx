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
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const buttonVariants = cva(
  // Base styles - applied to all variants
  [
    'inline-flex items-center justify-center',
    'text-sm font-medium',
    'border border-transparent rounded-md',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'transition-all duration-200',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
  ].join(' '),
  {
    variants: {
      variant: {
        primary: [
          'text-white bg-brand-600',
          'hover:bg-brand-700',
          'active:bg-brand-800 active:scale-95',
          'focus:ring-brand-500',
          'shadow-sm',
        ].join(' '),
        secondary: [
          'text-gray-700 bg-white border-gray-300',
          'hover:bg-gray-50',
          'active:bg-gray-100 active:scale-95',
          'focus:ring-brand-500',
          'shadow-sm',
          'dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600',
          'dark:hover:bg-gray-700',
        ].join(' '),
        outline: [
          'text-brand-700 bg-transparent border-brand-600',
          'hover:bg-brand-50',
          'active:bg-brand-100 active:scale-95',
          'focus:ring-brand-500',
          'dark:text-brand-400 dark:border-brand-500',
          'dark:hover:bg-brand-950',
        ].join(' '),
        ghost: [
          'text-gray-700 bg-transparent border-transparent',
          'hover:bg-gray-100',
          'active:bg-gray-200 active:scale-95',
          'focus:ring-gray-500',
          'dark:text-gray-200',
          'dark:hover:bg-gray-800',
        ].join(' '),
        destructive: [
          'text-white bg-error',
          'hover:bg-error-dark',
          'active:bg-red-800 active:scale-95',
          'focus:ring-error',
          'shadow-sm',
        ].join(' '),
        success: [
          'text-white bg-success',
          'hover:bg-success-dark',
          'active:bg-green-800 active:scale-95',
          'focus:ring-success',
          'shadow-sm',
        ].join(' '),
      },
      size: {
        sm: 'px-4 py-2 text-xs', // Base 8: 16px horizontal, 8px vertical
        md: 'px-4 py-2 text-sm', // Base 8: 16px horizontal, 8px vertical
        lg: 'px-6 py-3 text-base', // Base 8: 24px horizontal, 12px (exception for visual balance)
        xl: 'px-8 py-4 text-lg', // Base 8: 32px horizontal, 16px vertical
        icon: 'p-2', // Base 8: 8px all around (44x44 minimum touch target)
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * If true, renders as a Slot component for composition
   * Useful for rendering as a child component (e.g., Link)
   */
  asChild?: boolean;
  /**
   * Loading state - shows spinner and disables button
   */
  isLoading?: boolean;
  /**
   * Icon to show on the left side
   */
  leftIcon?: React.ReactNode;
  /**
   * Icon to show on the right side
   */
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      asChild = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
