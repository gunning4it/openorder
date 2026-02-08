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
import { cn } from '../lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * Label text for the textarea
   */
  label?: string;
  /**
   * Error message to display below textarea
   */
  error?: string;
  /**
   * Helper text to display below textarea
   */
  helperText?: string;
  /**
   * Show character counter
   */
  showCounter?: boolean;
  /**
   * Full width textarea
   */
  fullWidth?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      showCounter = false,
      fullWidth = false,
      id,
      disabled,
      maxLength,
      value,
      ...props
    },
    ref
  ) => {
    // Generate unique ID for label association if not provided
    const textareaId = id || React.useId();

    // Calculate character count
    const characterCount =
      typeof value === 'string' ? value.length : 0;

    return (
      <div className={cn('flex flex-col gap-2', fullWidth && 'w-full')}>
        {/* Label */}
        <div className="flex items-center justify-between">
          {label && (
            <label
              htmlFor={textareaId}
              className="text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              {label}
              {props.required && (
                <span className="ml-1 text-error" aria-label="required">
                  *
                </span>
              )}
            </label>
          )}
          {/* Character Counter */}
          {showCounter && maxLength && (
            <span
              className={cn(
                'text-sm',
                characterCount > maxLength
                  ? 'text-error'
                  : 'text-gray-500 dark:text-gray-400'
              )}
              aria-live="polite"
            >
              {characterCount} / {maxLength}
            </span>
          )}
        </div>

        {/* Textarea Field */}
        <textarea
          id={textareaId}
          ref={ref}
          disabled={disabled}
          maxLength={maxLength}
          value={value}
          className={cn(
            // Base styles
            'block w-full rounded-md border text-sm',
            'placeholder:text-gray-400',
            'transition-all duration-200',
            'resize-y', // Allow vertical resize only
            // Spacing (Base 8)
            'px-4 py-2',
            // Default state
            'border-gray-300 bg-white text-gray-900',
            'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100',
            // Focus state (accessibility requirement)
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-0 focus:border-brand-500',
            // Hover state
            'hover:border-gray-400 dark:hover:border-gray-500',
            // Error state
            error && [
              'border-error',
              'focus:ring-error focus:border-error',
              'hover:border-error',
            ],
            // Disabled state
            disabled && [
              'cursor-not-allowed opacity-50 bg-gray-50',
              'dark:bg-gray-900',
            ],
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error
              ? `${textareaId}-error`
              : helperText
              ? `${textareaId}-helper`
              : undefined
          }
          {...props}
        />

        {/* Error Message */}
        {error && (
          <p id={`${textareaId}-error`} className="text-sm text-error" role="alert">
            {error}
          </p>
        )}

        {/* Helper Text */}
        {helperText && !error && (
          <p
            id={`${textareaId}-helper`}
            className="text-sm text-gray-600 dark:text-gray-400"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };
