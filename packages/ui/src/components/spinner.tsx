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

const spinnerVariants = cva('animate-spin', {
  variants: {
    size: {
      sm: 'h-4 w-4', // 16px
      md: 'h-6 w-6', // 24px
      lg: 'h-8 w-8', // 32px
      xl: 'h-12 w-12', // 48px
    },
    variant: {
      default: 'text-brand-600',
      primary: 'text-brand-600',
      secondary: 'text-gray-600',
      white: 'text-white',
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'default',
  },
});

export interface SpinnerProps
  extends React.SVGAttributes<SVGElement>,
    VariantProps<typeof spinnerVariants> {
  /**
   * Label for screen readers
   */
  label?: string;
}

const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(
  ({ className, size, variant, label = 'Loading', ...props }, ref) => {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        className={cn(spinnerVariants({ size, variant, className }))}
        role="status"
        aria-label={label}
        {...props}
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
        <span className="sr-only">{label}</span>
      </svg>
    );
  }
);

Spinner.displayName = 'Spinner';

export interface SpinnerOverlayProps {
  /**
   * Show the spinner overlay
   */
  show: boolean;
  /**
   * Text to display below spinner
   */
  text?: string;
  /**
   * Spinner size
   */
  size?: SpinnerProps['size'];
}

/**
 * Full-page spinner overlay
 * Useful for page-level loading states
 */
const SpinnerOverlay: React.FC<SpinnerOverlayProps> = ({
  show,
  text,
  size = 'xl',
}) => {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-gray-900/80"
      role="alert"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4">
        <Spinner size={size} />
        {text && (
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
            {text}
          </p>
        )}
      </div>
    </div>
  );
};

SpinnerOverlay.displayName = 'SpinnerOverlay';

export { Spinner, SpinnerOverlay, spinnerVariants };
